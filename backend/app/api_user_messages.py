"""API でクライアントに返すユーザー向け日本語メッセージ。"""

# 共通
INVALID_REQUEST = "入力内容を確認してください。"
INTERNAL_SERVER_ERROR = "サーバー内部でエラーが発生しました。時間をおいて再度お試しください。"
REQUEST_FAILED = "リクエストの処理に失敗しました。"

# 認証
AUTH_NOT_CONFIGURED = "認証設定が未完了です。管理者にお問い合わせください。"
NOT_AUTHENTICATED = "ログインが必要です。"
INVALID_OR_EXPIRED_TOKEN = "認証情報の有効期限が切れているか、無効です。再度ログインしてください。"
INVALID_TOKEN = "無効な認証情報です。再度ログインしてください。"
USER_NOT_FOUND = "ユーザー情報が見つかりません。再度ログインしてください。"
TOKEN_REVOKED = "このセッションは無効になりました。再度ログインしてください。"
INVALID_CREDENTIALS = "メールアドレスまたはパスワードが正しくありません。"
REFRESH_FAILED = "セッションの更新に失敗しました。再度ログインしてください。"
REGISTRATION_FAILED = "登録に失敗しました。入力内容を確認してください。"
SIGNUP_FAILED = "アカウント作成に失敗しました。入力内容を確認してください。"
REGISTER_USER_FAILED = "ユーザー登録に失敗しました。入力内容を確認してください。"
REGISTER_USER_COMPLETED = "ユーザー登録が完了しました。"
SERVICE_TOKEN_INVALID = "サービス登録トークンが無効です。"
ORGANIZATION_ALREADY_SET = "このユーザーは既に組織に所属しています。"
ORGANIZATION_CREATED = "組織の作成が完了しました。"

# 権限
FORBIDDEN = "この操作を実行する権限がありません。"
NO_LINKED_EMPLOYEE = "アカウントに紐づく職員情報が見つかりません。管理者にお問い合わせください。"

# 組織
INVITE_LIMIT_REACHED = "招待可能な上限に達しているため、招待できません。"
SUBSCRIPTION_INACTIVE = "サブスクリプションが有効ではないため、招待できません。"
FAILED_CREATE_INVITATION = "招待の作成に失敗しました。時間をおいて再度お試しください。"
FAILED_CREATE_EMPLOYEE = "職員の作成に失敗しました。時間をおいて再度お試しください。"
EMPLOYEE_NOT_FOUND = "職員情報が見つかりません。"
INVALID_PERIOD = "過去月のシフトは生成できません。"
FAILED_GENERATE_SHIFTS = "シフト生成に失敗しました。時間をおいて再度お試しください。"
FAILED_CLEAR_SHIFTS = "既存シフトのクリアに失敗しました。時間をおいて再度お試しください。"
FAILED_SAVE_SHIFTS = "シフトの保存に失敗しました。時間をおいて再度お試しください。"
SHIFT_NOT_FOUND = "シフトが見つかりません。"
INVITATION_USER_NOT_FOUND = "指定されたメールアドレスの登録ユーザーが見つかりません。"
INVITATION_ALREADY_EXISTS = "このユーザーには既に招待を送信しています。"
INVITATION_ACCEPTED = "招待を受諾しました。"
INVITATION_NOT_FOUND = "招待が見つかりません。"
INVITATION_EXPIRED = "この招待は期限切れです。"
INVITATION_NOT_ALLOWED = "この招待は受諾できません。"

# 職員
ALREADY_REQUESTED_DAY_OFF = "同じ日付の希望休は既に申請済みです。"
DAY_OFF_NOT_FOUND = "希望休が見つかりません。"
CANNOT_DELETE_OTHERS_DAY_OFF = "他のユーザーの希望休は取り消せません。"
REQUIRE_PERIOD_PARAMS = "year+month または start+end を指定してください。"

# admin
SERVICE_TOKEN_CREATED = "サービス登録トークンを発行しました。"
SERVICE_TOKEN_REVOKED = "サービス登録トークンを失効しました。"
SERVICE_TOKEN_NOT_FOUND = "指定されたサービス登録トークンが見つかりません。"
