package request

type LoginResponse struct {
	Status  int       `json:"status"`
	Message string    `json:"message"`
	Data    LoginData `json:"data"`
}
type LoginData struct {
	TelID       string `json:"tel_id"`
	ID          int    `json:"id"`
	Fn          string `json:"fn"`
	Ln          string `json:"ln"`
	AccessToken string `json:"access_token"`
	PhotoURL    string `json:"photo_url"`
	IsKol       int    `json:"is_kol"`
}
type GetBalanceResponse struct {
	Status  int            `json:"status"`
	Message string         `json:"message"`
	Data    GetBalanceData `json:"data"`
}
type Farming struct {
	GameID    string      `json:"game_id"`
	RoundID   string      `json:"round_id"`
	UserID    int         `json:"user_id"`
	StartAt   int         `json:"start_at"`
	EndAt     int         `json:"end_at"`
	LastClaim int         `json:"last_claim"`
	Points    interface{} `json:"points"`
}
type Daily struct {
	RoundID      string      `json:"round_id"`
	UserID       int         `json:"user_id"`
	StartAt      int         `json:"start_at"`
	LastCheckTs  int         `json:"last_check_ts"`
	LastCheckYmd int         `json:"last_check_ymd"`
	NextCheckTs  int         `json:"next_check_ts"`
	CheckCounter int         `json:"check_counter"`
	TodayPoints  interface{} `json:"today_points"`
	TodayGame    int         `json:"today_game"`
}
type GetBalanceData struct {
	AvailableBalance interface{} `json:"available_balance"`
	PlayPasses       int         `json:"play_passes"`
	Timestamp        int         `json:"timestamp"`
	Farming          *Farming    `json:"farming"`
	Daily            *Daily      `json:"daily"`
}

type PlayGameResponse struct {
	Status  int          `json:"status"`
	Message string       `json:"message"`
	Data    PlayGameData `json:"data"`
}
type PlayGameData struct {
	RoundID string `json:"round_id"`
	GameID  string `json:"game_id"`
	UserID  int    `json:"user_id"`
	StartAt int    `json:"start_at"`
	EndAt   int    `json:"end_at"`
}
