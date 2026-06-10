"""
state_machine/result.py — LabelResult 状态机
Author: hongchuwudi
Description: 5 状态简化模型 — AI初审 + 人工终审
# Class: ResultStatus — 审核状态枚举
# Constant: RESULT_TRANSITIONS — 合法转移表
"""
from enum import Enum
from typing import Dict, Set
from app.state_machine.base import register


# ResultStatus — 6 状态: 提交→AI→复审→终审→入库/打回
class ResultStatus(str, Enum):
    SUBMITTED = "submitted"       # 标注员提交
    AI_REVIEWING = "ai_reviewing" # AI 审核中
    REJECTED = "rejected"         # 打回（AI/复审/终审均可打回）
    REVIEW = "review"             # 复审（AI通过或可疑→人工确认）
    FINAL_REVIEW = "final_review" # 终审（复审通过后）
    WAREHOUSE = "warehouse"       # 归档入库


# RESULT_TRANSITIONS — 6 条通道
#         submitted → ai_reviewing → rejected (AI直接打回)
#                                 → review (AI通过/可疑→复审)
#                                      → rejected (复审打回)
#                                      → final_review (复审通过)
#                                           → rejected (终审打回)
#                                           → warehouse (入库)

RESULT_TRANSITIONS: Dict[ResultStatus, Set[ResultStatus]] = {
    ResultStatus.SUBMITTED: {
        ResultStatus.SUBMITTED,
        ResultStatus.AI_REVIEWING,
    },
    ResultStatus.AI_REVIEWING: {
        ResultStatus.AI_REVIEWING,
        ResultStatus.REVIEW,        # AI通过/可疑 → 复审
        ResultStatus.REJECTED,      # AI不合格 → 直接打回
    },
    ResultStatus.REVIEW: {
        ResultStatus.REVIEW,        # 重试
        ResultStatus.FINAL_REVIEW,  # 复审通过 → 终审
        ResultStatus.REJECTED,      # 复审打回
    },
    ResultStatus.FINAL_REVIEW: {
        ResultStatus.FINAL_REVIEW,  # 重试
        ResultStatus.WAREHOUSE,     # 终审通过 → 入库
        ResultStatus.REJECTED,      # 终审打回
    },
    ResultStatus.REJECTED: {
        ResultStatus.REVIEW,        # 审核员重新打开（误操作恢复/申诉）
    },
    ResultStatus.WAREHOUSE: set(),
}

register("LabelResult.status", RESULT_TRANSITIONS)
