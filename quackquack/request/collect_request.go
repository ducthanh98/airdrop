package request

type CollectEggRequest struct {
	NestID int `json:"nest_id"`
}

type LayEggRequest struct {
	NestID int `json:"nest_id"`
	DuckID int `json:"duck_id"`
}

type CollectGoldenDuckRequest struct {
	Type int `json:"type"`
}

type RemoveDuckRequest1 struct {
	Ducks string `json:"ducks"`
}

type RemoveDuckRequest2 struct {
	Ducks []int `json:"ducks"`
}
