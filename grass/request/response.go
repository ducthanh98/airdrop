package request

type GetIPResponse struct {
	IP string `json:"ip"`
}

type WsMessage struct {
	ID     string `json:"id"`
	Action string `json:"action"`
}
