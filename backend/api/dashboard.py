"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend dashboard routing.
Talha: Do not modify dashboard aggregation unless coordinating backend integration.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.core.auth import CurrentUser, get_optional_current_user
from backend.core.database import database
from backend.core.srs import get_srs_stats
from backend.models.schema import DashboardResponse, DailyGoalSchema, NextLessonSchema, StreakDaySchema, StreakSchema

router = APIRouter(tags=["dashboard"])

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


def _resolve_timezone(timezone_name: str | None) -> ZoneInfo:
    if not timezone_name:
        return ZoneInfo("UTC")
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def _today_for_timezone(timezone_name: str | None) -> date:
    return datetime.now(_resolve_timezone(timezone_name)).date()


def _build_week_days(today: date, activity_lookup: dict[date, dict[str, int]]) -> list[StreakDaySchema]:
    week_days: list[StreakDaySchema] = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        activity = activity_lookup.get(day, {"minutes": 0, "xp": 0})
        week_days.append(
            StreakDaySchema(
                day=day.isoformat(),
                minutes=int(activity.get("minutes", 0)),
                xp=int(activity.get("xp", 0)),
                active=int(activity.get("minutes", 0)) > 0,
            )
        )
    return week_days


def _calculate_streak(today: date, activity_lookup: dict[date, dict[str, int]]) -> int:
    count = 0
    current = today
    while activity_lookup.get(current, {"minutes": 0}).get("minutes", 0) > 0:
        count += 1
        current -= timedelta(days=1)
    return count


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> DashboardResponse:
    user_id = current_user.user_id if current_user else DEFAULT_USER_ID
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            profile = await connection.fetchrow(
                """
                SELECT daily_goal_min, timezone
                FROM user_profiles
                WHERE user_id = $1
                """,
                user_id,
            )
            timezone_name = profile["timezone"] if profile else "UTC"
            today = _today_for_timezone(timezone_name)

            activity_rows = await connection.fetch(
                """
                SELECT day, minutes, xp
                FROM activity_days
                WHERE user_id = $1
                  AND day BETWEEN $2 AND $3
                ORDER BY day ASC
                """,
                user_id,
                today - timedelta(days=6),
                today,
            )
            activity_lookup = {
                row["day"]: {"minutes": row["minutes"], "xp": row["xp"]}
                for row in activity_rows
            }
            today_activity = activity_lookup.get(today, {"minutes": 0, "xp": 0})

            streak = _calculate_streak(today, activity_lookup)
            week_days = _build_week_days(today, activity_lookup)

            active_lesson = await connection.fetchrow(
                """
                SELECT
                  li.id AS instance_id,
                  li.status,
                  li.current_node_index,
                  li.title AS instance_title,
                  ls.slot_key,
                  ls.position AS lesson_position,
                  u.position AS unit_position,
                  u.title AS unit_title
                FROM lesson_instances li
                JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                JOIN units u ON u.id = ls.unit_id
                WHERE li.user_id = $1
                  AND li.status IN ('in_progress', 'ready', 'compiling')
                ORDER BY
                  CASE li.status
                    WHEN 'in_progress' THEN 0
                    WHEN 'ready' THEN 1
                    WHEN 'compiling' THEN 2
                    ELSE 3
                  END,
                  u.position ASC,
                  ls.position ASC
                LIMIT 1
                """,
                user_id,
            )

            if not active_lesson:
                active_lesson = await connection.fetchrow(
                    """
                    SELECT
                      NULL::uuid AS instance_id,
                      NULL::text AS status,
                      0::numeric AS current_node_index,
                      NULL::text AS instance_title,
                      ls.slot_key,
                      ls.position AS lesson_position,
                      u.position AS unit_position,
                      u.title AS unit_title
                    FROM lesson_slots ls
                    JOIN units u ON u.id = ls.unit_id
                    LEFT JOIN lesson_instances li
                      ON li.lesson_slot_id = ls.id
                     AND li.user_id = $1
                     AND li.status = 'completed'
                    WHERE li.id IS NULL
                    ORDER BY u.position ASC, ls.position ASC
                    LIMIT 1
                    """,
                    user_id,
                )

            next_lesson = None
            if active_lesson:
                next_lesson = NextLessonSchema(
                    instance_id=str(active_lesson["instance_id"]) if active_lesson["instance_id"] else None,
                    slot_key=active_lesson["slot_key"],
                    title=active_lesson["instance_title"] or f"{active_lesson['unit_title']} - Lesson {active_lesson['lesson_position']}",
                    status=active_lesson["status"] or "available",
                    current_node_index=float(active_lesson["current_node_index"] or 0),
                    lesson_position=active_lesson["lesson_position"],
                )

            srs_stats = await get_srs_stats(connection, user_id)

            return DashboardResponse(
                daily_goal=DailyGoalSchema(
                    minutes=int(today_activity.get("minutes", 0)),
                    target=int(profile["daily_goal_min"]) if profile else 20,
                ),
                streak=StreakSchema(
                    count=streak,
                    week_days=week_days,
                ),
                next_lesson=next_lesson,
                srs_due_count=srs_stats["due_count"],
            )
    except Exception as e:
        print(f"Returning mock dashboard data due to DB error: {repr(e)}")
        # Return mock data until DB schema is applied
        return DashboardResponse(
            daily_goal=DailyGoalSchema(minutes=13, target=20),
            streak=StreakSchema(
                count=12,
                week_days=[
                    StreakDaySchema(day=(datetime.now() - timedelta(days=6)).isoformat(), minutes=15, xp=150, active=True),
                    StreakDaySchema(day=(datetime.now() - timedelta(days=5)).isoformat(), minutes=20, xp=200, active=True),
                    StreakDaySchema(day=(datetime.now() - timedelta(days=4)).isoformat(), minutes=0, xp=0, active=False),
                    StreakDaySchema(day=(datetime.now() - timedelta(days=3)).isoformat(), minutes=25, xp=250, active=True),
                    StreakDaySchema(day=(datetime.now() - timedelta(days=2)).isoformat(), minutes=10, xp=100, active=True),
                    StreakDaySchema(day=(datetime.now() - timedelta(days=1)).isoformat(), minutes=30, xp=300, active=True),
                    StreakDaySchema(day=datetime.now().isoformat(), minutes=13, xp=130, active=True),
                ]
            ),
            next_lesson=NextLessonSchema(
                instance_id="test",
                slot_key="u1l1",
                title="Unit 1: The First Impression",
                status="in_progress",
                current_node_index=2.0,
                lesson_position=1
            ),
            srs_due_count=14
        )

@router.get("/me")
async def get_me(current_user: CurrentUser | None = Depends(get_optional_current_user)):
    user_id = current_user.user_id if current_user else DEFAULT_USER_ID
    
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            profile = await connection.fetchrow(
                """
                SELECT display_name, level, coach_voice, daily_goal_min, timezone
                FROM user_profiles
                WHERE user_id = $1
                """,
                user_id,
            )
            
            xp_row = await connection.fetchrow(
                "SELECT COALESCE(SUM(amount), 0) AS total_xp FROM xp_events WHERE user_id = $1",
                user_id
            )
            total_xp = xp_row["total_xp"] if xp_row else 0
            
            # Use same streak calculation logic as dashboard
            timezone_name = profile["timezone"] if profile else "UTC"
            today = _today_for_timezone(timezone_name)
            
            activity_rows = await connection.fetch(
                "SELECT day, minutes FROM activity_days WHERE user_id = $1 AND day <= $2 ORDER BY day DESC",
                user_id, today
            )
            activity_lookup = {row["day"]: {"minutes": row["minutes"]} for row in activity_rows}
            streak = _calculate_streak(today, activity_lookup)
            
            # Fall back to auth token's display_name if no DB profile yet
            auth_display_name = current_user.display_name if current_user else None
            return {
                "id": user_id,
                "name": profile["display_name"] if profile else (current_user.display_name if current_user else "User"),
                "email": current_user.email if current_user else "",
                "level": profile["level"] if profile else "intermediate",
                "settings": {
                    "coach_voice": profile["coach_voice"] if profile else "balanced",
                    "daily_goal_min": profile["daily_goal_min"] if profile else 20
                },
                "total_xp": total_xp,
                "streak_count": streak
            }
    except Exception as e:
        print(f"Returning mock /me data due to DB error: {repr(e)}")
        return {
            "id": user_id,
            "name": current_user.display_name if current_user else "Fallback User",
            "email": current_user.email if current_user else "",
            "level": "intermediate",
            "settings": {"coach_voice": "balanced", "daily_goal_min": 20},
            "total_xp": 0,
            "streak_count": 0
        }

class SettingsUpdate(BaseModel):
    coach_voice: str | None = None
    daily_goal_min: int | None = None
    timezone: str | None = None
    level: str | None = None
    display_name: str | None = None

@router.patch("/me/settings")
async def update_settings(
    settings: SettingsUpdate,
    current_user: CurrentUser | None = Depends(get_optional_current_user)
):
    user_id = current_user.user_id if current_user else DEFAULT_USER_ID
    
    updates = []
    values = []
    idx = 1
    
    if settings.coach_voice is not None:
        updates.append(f"coach_voice = ${idx}")
        values.append(settings.coach_voice)
        idx += 1
    if settings.daily_goal_min is not None:
        updates.append(f"daily_goal_min = ${idx}")
        values.append(settings.daily_goal_min)
        idx += 1
    if settings.timezone is not None:
        updates.append(f"timezone = ${idx}")
        values.append(settings.timezone)
        idx += 1
    if settings.level is not None:
        updates.append(f"level = ${idx}")
        values.append(settings.level)
        idx += 1
    if settings.display_name is not None:
        updates.append(f"display_name = ${idx}")
        values.append(settings.display_name)
        idx += 1
        
    if not updates:
        return {"status": "no_changes"}
        
    updates_sql = ", ".join(updates)
    
    values.append(user_id)
    
    # We use an UPSERT (INSERT ... ON CONFLICT DO UPDATE) so that users who signed in 
    # via Google OAuth (and skipped onboarding) get a profile gracefully created.
    query = f"""
        INSERT INTO user_profiles (user_id) 
        VALUES (${idx}) 
        ON CONFLICT (user_id) DO UPDATE SET {updates_sql}
    """
    
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            await connection.execute(query, *values)
            return {"status": "success"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")
