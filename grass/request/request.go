package request

type PingRequest struct {
	ID      string `json:"id"`
	Version string `json:"version"`
	Action  string `json:"action"`
	Data    struct {
	} `json:"data"`
}

type PongRequest struct {
	ID           string `json:"id"`
	OriginAction string `json:"origin_action"`
}

type AuthRequest struct {
	ID           string   `json:"id"`
	OriginAction string   `json:"origin_action"`
	Result       AuthData `json:"result"`
}

type AuthData struct {
	BrowserID  string `json:"browser_id"`
	UserID     string `json:"user_id"`
	UserAgent  string `json:"user_agent"`
	Timestamp  int    `json:"timestamp"`
	DeviceType string `json:"device_type"`
	Version    string `json:"version"`
}

type PongMessage struct {
	ID           string `json:"id"`
	OriginAction string `json:"origin_action"`
}

type PingMessage struct {
	ID     string `json:"id"`
	Action string `json:"action"`
}

type AuthRequestCommunity struct {
	ID           string          `json:"id"`
	OriginAction string          `json:"origin_action"`
	Result       ResultCommunity `json:"result"`
}
type ResultCommunity struct {
	BrowserID   string `json:"browser_id"`
	UserID      string `json:"user_id"`
	UserAgent   string `json:"user_agent"`
	Timestamp   int    `json:"timestamp"`
	DeviceType  string `json:"device_type"`
	Version     string `json:"version"`
	ExtensionID string `json:"extension_id"`
}

type DeviceParam struct {
	DeviceId string `json:"deviceId"`
}
