"""状态机包——任务/条目/提交/审核多级状态转移校验"""
from app.state_machine.base import validate_transition, transit
from app.state_machine.item import ItemStatus, ITEM_TRANSITIONS
from app.state_machine.result import ResultStatus, RESULT_TRANSITIONS
from app.state_machine.task import TaskStatus, TASK_TRANSITIONS
