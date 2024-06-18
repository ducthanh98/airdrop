package request

type AuthMessage struct {
	ID           string `json:"id"`
	Action       string `json:"action"`
	UserID       string `json:"user_id"`
	BrowserID    string `json:"browser_id"`
	UserAgent    string `json:"user_agent"`
	Timestamp    string `json:"timestamp"`
	DeviceType   string `json:"device_type"`
	Version      string `json:"version"`
	Token        string `json:"token"`
	OriginAction string `json:"origin_action"`
}

type PongMessage struct {
	ID           string `json:"id"`
	OriginAction string `json:"origin_action"`
}

type PingMessage struct {
	ID     string `json:"id"`
	Action string `json:"action"`
}
