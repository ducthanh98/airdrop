package request

import "time"

type GetAllDuck struct {
	ErrorCode string `json:"error_code"`
	Data      struct {
		Nest []struct {
			ID          int         `json:"id"`
			Status      int         `json:"status"`
			EggConfigID int         `json:"egg_config_id"`
			FinishTime  interface{} `json:"finish_time"`
			TypeEgg     int         `json:"type_egg"`
			UpdatedTime time.Time   `json:"updated_time"`
			RemainTime  interface{} `json:"remain_time"`
		} `json:"nest"`
		Duck []struct {
			ID       int `json:"id"`
			UserID   int `json:"user_id"`
			Status   int `json:"status"`
			Metadata struct {
				ArmRare  int `json:"arm_rare"`
				ArmType  int `json:"arm_type"`
				BodyRare int `json:"body_rare"`
				BodyType int `json:"body_type"`
				HeadRare int `json:"head_rare"`
				HeadType int `json:"head_type"`
			} `json:"metadata"`
			TotalRare      int         `json:"total_rare"`
			CreatedTime    time.Time   `json:"created_time"`
			UpdatedTime    time.Time   `json:"updated_time"`
			LastActiveTime interface{} `json:"last_active_time"`
			Type           int         `json:"type"`
		} `json:"duck"`
		TimeStamp int `json:"time_stamp"`
	} `json:"data"`
}

type MaxDuckResponse struct {
	ErrorCode string `json:"error_code"`
	Data      struct {
		MaxDuck int `json:"max_duck"`
	} `json:"data"`
}
