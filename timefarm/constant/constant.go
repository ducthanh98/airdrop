package constant

import "fmt"

const BASE_URL = "https://tg-bot-tap.laborx.io/api/v1"

var AuthAPI = fmt.Sprintf("%v/auth/validate-init", BASE_URL)
var FinishAPI = fmt.Sprintf("%v/farming/finish", BASE_URL)
var StartAPI = fmt.Sprintf("%v/farming/start", BASE_URL)
var GetTaskAPI = fmt.Sprintf("%v/tasks", BASE_URL)
var SubmitTaskAPI = fmt.Sprintf("%v/tasks/%v/submissions", BASE_URL, "%v")
var ClaimTaskAPI = fmt.Sprintf("%v/tasks/%v/claims", BASE_URL, "%v")

const (
	TaskStatusComplete = "COMPLETED"
	TaskStatusClaim    = "CLAIMED"
)
