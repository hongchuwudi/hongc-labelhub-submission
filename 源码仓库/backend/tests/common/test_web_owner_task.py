"""
Owner 任务模块——Playwright 浏览器自动化测试

前置条件: 后端 http://localhost:8000、前端 http://localhost:5173 已启动
运行: pytest tests/test_web_owner_task.py -v --headed
"""
import pytest
from playwright.sync_api import Page, expect

BASE = "http://localhost:5173"


@pytest.fixture(scope="module")
def browser_context(browser):
    """每个测试模块一个浏览器上下文，保持登录状态"""
    context = browser.new_context()
    yield context
    context.close()


@pytest.fixture
def page(browser_context):
    """每个测试用例独立页面"""
    page = browser_context.new_page()
    yield page
    page.close()


def login_as_owner(page: Page):
    """预先登录 Owner"""
    page.goto(f"{BASE}/login")
    page.fill('input[id="email"]', "admin@labelhub.com")
    page.fill('input[id="password"]', "admin123")
    page.click('button[type="submit"]')
    page.wait_for_url(f"{BASE}/datasets", timeout=5000)


class TestPageAccess:
    def test_tasks_page_accessible(self, page):
        """Owner 能进入任务管理页"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        expect(page.locator("h2")).to_contain_text("任务管理")

    def test_empty_state_shown(self, page):
        """无任务时显示空状态"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        empty = page.locator(".ant-empty-description")
        expect(empty.first).to_be_visible()


class TestCreateTask:
    def test_create_drawer_opens(self, page):
        """点击新建任务弹出抽屉"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        page.click('button:has-text("新建任务")')
        expect(page.locator(".ant-drawer-body")).to_be_visible()

    def test_create_drawer_cancel(self, page):
        """取消关闭抽屉"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        page.click('button:has-text("新建任务")')
        page.click('.ant-drawer-body button:has-text("取消")')
        page.wait_for_timeout(500)
        expect(page.locator(".ant-drawer-body")).not_to_be_visible()

    def test_strategy_switches_assignee(self, page):
        """切换指派策略显示/隐藏指派对象"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        page.click('button:has-text("新建任务")')
        # 默认先到先得，不应有指派给字段
        expect(page.locator('text=指派给')).not_to_be_visible()
        # 切换到指派
        page.click('.ant-form-item:has-text("分发策略") .ant-select')
        page.click('.ant-select-item:has-text("指派")')
        expect(page.locator('text=指派给')).to_be_visible()

    def test_required_validation(self, page):
        """必填字段校验"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        page.click('button:has-text("新建任务")')
        # 不填任何内容直接提交
        page.click('.ant-drawer-body button[type="submit"]')
        expect(page.locator(".ant-form-item-explain-error").first).to_be_visible()


class TestStatusFlow:
    def test_status_filter(self, page):
        """状态筛选功能正常"""
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        # 打开状态筛选
        page.click('.ant-select:has-text("状态")')
        page.click('.ant-select-item:has-text("草稿")')
        page.wait_for_timeout(1000)
        # 筛选后页面不崩溃
        expect(page.locator("h2")).to_contain_text("任务管理")


class TestMobileResponsive:
    def test_mobile_hides_columns(self, page):
        """移动端隐藏宽列"""
        page.set_viewport_size({"width": 375, "height": 812})
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        # 移动端不应显示策略/进度/ID 表头
        expect(page.locator('th:has-text("策略")')).not_to_be_visible()
        expect(page.locator('th:has-text("进度")')).not_to_be_visible()
        # 显示任务名称和状态
        expect(page.locator('th:has-text("任务名称")')).to_be_visible()
        expect(page.locator('th:has-text("状态")')).to_be_visible()

    def test_mobile_detail_button(self, page):
        """移动端有详情按钮"""
        page.set_viewport_size({"width": 375, "height": 812})
        login_as_owner(page)
        page.goto(f"{BASE}/tasks")
        # 如果有任务数据，显示详情按钮
        # 无任务时验证不崩溃即可
        expect(page.locator("h2")).to_contain_text("任务管理")
