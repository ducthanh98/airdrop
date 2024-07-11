package request

type WsRequest struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
type HeartbeatData struct {
	Status string `json:"status"`
}

type Schedule struct {
	Mode      string   `json:"mode"`
	Days      []string `json:"days"`
	StartTime string   `json:"startTime"`
	StopTime  string   `json:"stopTime"`
	Usage     string   `json:"usage"`
}
type UserSettings struct {
	Schedule      Schedule      `json:"schedule"`
	EnabledModels []interface{} `json:"enabledModels"`
}
type Usage struct {
	Idle   int `json:"idle"`
	Kernel int `json:"kernel"`
	Total  int `json:"total"`
	User   int `json:"user"`
}
type Processors struct {
	Usage Usage `json:"usage"`
}
type CPUInfo struct {
	ArchName        string        `json:"archName"`
	Features        []interface{} `json:"features"`
	ModelName       string        `json:"modelName"`
	NumOfProcessors int           `json:"numOfProcessors"`
	Processors      []Processors  `json:"processors"`
	Temperatures    []interface{} `json:"temperatures"`
}
type MemoryInfo struct {
	AvailableCapacity int64 `json:"availableCapacity"`
	Capacity          int64 `json:"capacity"`
}
type GpuInfo struct {
	Vendor   string `json:"vendor"`
	Renderer string `json:"renderer"`
}
type SystemInfo struct {
	CPUInfo    CPUInfo    `json:"cpuInfo"`
	MemoryInfo MemoryInfo `json:"memoryInfo"`
	GpuInfo    GpuInfo    `json:"gpuInfo"`
}
type SettingData struct {
	MostRecentModel  string       `json:"mostRecentModel"`
	UserSettings     UserSettings `json:"userSettings"`
	SystemInfo       SystemInfo   `json:"systemInfo"`
	ExtensionVersion string       `json:"extensionVersion"`
	ChromeVersion    string       `json:"chromeVersion"`
}
