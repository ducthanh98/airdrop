package request

type QueryData struct {
	ID int64 `json:"id"`
}

type LoginRequest struct {
	InitData   string `json:"init_data"`
	InviteCode string `json:"invite_code"`
}

type PlayGameRequest struct {
	GameID string `json:"game_id"`
}

type ClaimRequest struct {
	GameID string `json:"game_id"`
	Points int    `json:"points"`
}
