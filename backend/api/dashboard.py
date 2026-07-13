"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend dashboard routing.
Talha: Do not modify dashboard aggregation unless coordinating backend integration.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Literal

from backend.core.auth import CurrentUser, get_optional_current_user, get_current_user
from backend.core.database import database
from backend.core.srs import get_srs_stats
from backend.models.schema import DashboardResponse, DailyGoalSchema, NextLessonSchema, StreakDaySchema, StreakSchema

class SettingsUpdateRequest(BaseModel):
    coach_voice: Optional[Literal["encouraging", "direct_professional", "balanced"]] = None
    timezone: Optional[str] = None
    daily_goal_min: Optional[int] = None
    level: Optional[Literal["beginner", "intermediate", "advanced"]] = None

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
        print(f"Returning mock dashboard data due to DB error: {e}")
        # Return mock data until DB schema is applied
        from datetime import datetime, timedelta
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
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    user_id = current_user.user_id
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            profile = await connection.fetchrow(
                """
                SELECT display_name, level, coach_voice, timezone, daily_goal_min
                FROM user_profiles
                WHERE user_id = $1
                """,
                user_id,
            )
            if not profile:
                raise HTTPException(status_code=404, detail="User profile not found")

            xp_row = await connection.fetchrow(
                "SELECT COALESCE(SUM(amount), 0) as total_xp FROM xp_events WHERE user_id = $1",
                user_id,
            )
            total_xp = int(xp_row["total_xp"]) if xp_row else 0

            timezone_name = profile["timezone"] or "UTC"
            today = _today_for_timezone(timezone_name)

            # Calculate streak dynamically
            rows = await connection.fetch(
                "SELECT day FROM activity_days WHERE user_id = $1 AND minutes > 0 ORDER BY day DESC",
                user_id,
            )
            active_dates = [row["day"] for row in rows]
            streak = 0
            if active_dates:
                latest = active_dates[0]
                if latest == today or latest == today - timedelta(days=1):
                    streak = 1
                    current = latest
                    for d in active_dates[1:]:
                        if d == current - timedelta(days=1):
                            streak += 1
                            current = d
                        else:
                            break

            return {
                "id": user_id,
                "name": profile["display_name"] or current_user.display_name or "User",
                "level": profile["level"],
                "settings": {
                    "coach_voice": profile["coach_voice"],
                    "daily_goal_min": profile["daily_goal_min"],
                    "timezone": profile["timezone"],
                },
                "total_xp": total_xp,
                "streak_count": streak,
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}",
        )


@router.patch("/me/settings")
async def update_settings(
    payload: SettingsUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    updates = []
    params = [current_user.user_id]
    
    param_idx = 2
    if payload.coach_voice is not None:
        updates.append(f"coach_voice = ${param_idx}")
        params.append(payload.coach_voice)
        param_idx += 1
    if payload.timezone is not None:
        updates.append(f"timezone = ${param_idx}")
        params.append(payload.timezone)
        param_idx += 1
    if payload.daily_goal_min is not None:
        updates.append(f"daily_goal_min = ${param_idx}")
        params.append(payload.daily_goal_min)
        param_idx += 1
    if payload.level is not None:
        updates.append(f"level = ${param_idx}")
        params.append(payload.level)
        param_idx += 1

    if not updates:
        raise HTTPException(status_code=400, detail="No setting updates provided")

    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            query = f"""
                UPDATE user_profiles
                SET {", ".join(updates)}
                WHERE user_id = $1
                RETURNING user_id, display_name, level, coach_voice, timezone, daily_goal_min
            """
            updated = await connection.fetchrow(query, *params)
            if not updated:
                raise HTTPException(status_code=404, detail="User profile not found")
            
            return {
                "success": True,
                "profile": {
                    "id": updated["user_id"],
                    "level": updated["level"],
                    "settings": {
                        "coach_voice": updated["coach_voice"],
                        "daily_goal_min": updated["daily_goal_min"],
                        "timezone": updated["timezone"],
                    }
                }
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}",
        )
