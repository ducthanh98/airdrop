package request

type GetIPResponse struct {
	IP string `json:"ip"`
}

type WsMessage struct {
	ID     string `json:"id"`
	Action string `json:"action"`
}

type AuthSessionResponse struct {
	Success bool            `json:"success"`
	Code    int             `json:"code"`
	Msg     string          `json:"msg"`
	Data    AuthSessionData `json:"data"`
}
type Balance struct {
	CurrentAmount  float64 `json:"current_amount"`
	TotalCollected float64 `json:"total_collected"`
	TotalRedeemed  float64 `json:"total_redeemed"`
}
type AuthSessionData struct {
	UID          string  `json:"uid"`
	Name         string  `json:"name"`
	Email        string  `json:"email"`
	Avatar       string  `json:"avatar"`
	ReferralCode string  `json:"referral_code"`
	State        string  `json:"state"`
	ReferralLink string  `json:"referral_link"`
	Balance      Balance `json:"balance"`
}
