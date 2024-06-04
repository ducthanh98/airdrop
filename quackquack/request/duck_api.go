package request

import (
	"encoding/json"
	"github.com/go-resty/resty/v2"
	"quackquack/constant"
)

type DuckApi struct {
	Token string
}

func NewDuckApi(token string) *DuckApi {
	return &DuckApi{Token: token}
}

func (a *DuckApi) CollectEgg(nestId int) (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		SetBody(CollectEggRequest{NestID: nestId}).
		Post(constant.CollectAPI)

}

func (a *DuckApi) HatchDuck(nestId int) (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		SetBody(CollectEggRequest{NestID: nestId}).
		Post(constant.HatchEggApi)

}

func (a *DuckApi) CollectDuck(nestId int) (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		SetBody(CollectEggRequest{NestID: nestId}).
		Post(constant.CollectDuckApi)

}

func (a *DuckApi) LayEgg(nestId int, duckId int) (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		SetBody(LayEggRequest{NestID: nestId, DuckID: duckId}).
		Post(constant.LayEggAPI)

}

func (a *DuckApi) CollectGoldenDuck() (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		SetBody(CollectGoldenDuckRequest{Type: 1}).
		Post(constant.ClaimGoldenDuckAPI)

}

func (a *DuckApi) RewardGoldenDuck() (*resty.Response, error) {
	client := resty.New()

	return client.R().
		SetAuthToken(a.Token).
		Get(constant.RewardGoldenDuckAPI)

}

func (a *DuckApi) GetList() (*GetAllDuck, error) {
	client := resty.New()
	var res = &GetAllDuck{}

	_, err := client.R().
		SetAuthToken(a.Token).
		SetResult(res).
		Get(constant.ListAPI)
	return res, err

}

func (a *DuckApi) GetMaxDuck() (*MaxDuckResponse, error) {
	client := resty.New()
	var res = &MaxDuckResponse{}
	_, err := client.R().
		SetAuthToken(a.Token).
		SetResult(res).
		Get(constant.MaxDuckAPI)
	return res, err

}

func (a *DuckApi) RemoveDuck(duckIds []int) (*resty.Response, error) {
	client := resty.New()

	tmp := RemoveDuckRequest2{Ducks: duckIds}
	json_str, _ := json.Marshal(tmp)

	return client.R().
		SetAuthToken(a.Token).
		SetBody(RemoveDuckRequest1{Ducks: string(json_str)}).
		Post(constant.RemoveDuckApi)

}
