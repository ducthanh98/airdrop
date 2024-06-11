package main

import (
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/spf13/viper"
	"log"
	"nodepay/constant"
	"nodepay/request"
	"time"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	token := viper.GetString("data.token")

	client := resty.New()
	var publicIp *request.GetIPResponse

	_, err = client.R().
		SetResult(&publicIp).
		Get("https://api.ipify.org?format=json")
	if err != nil {
		panic("Can't get public ip")
	}

	go pingNetworkDevice(token, publicIp.IP)
	go connectSocket(token)
	select {}

}

func connectSocket(token string) {
	c, resp, err := websocket.DefaultDialer.Dial(constant.BASE_WSS, nil)
	if err != nil {
		log.Printf("handshake failed with status %d", resp.StatusCode)
		log.Fatal("dial:", err)
	}
	defer c.Close()
	for {
		_, payload, err := c.ReadMessage()
		if err != nil {
			log.Println("Read message error:", err)
			time.Sleep(1 * time.Minute)
			log.Println("Error. Reconnecting after a minute")
			go connectSocket(token)
			return
		}
		var msg *request.WsMessage
		json.Unmarshal(payload, &msg)
		log.Printf("recv: %s", msg)
		if msg.Action == "AUTH" {
			sendAuth(msg, token, c)
		} else if msg.Action == "PONG" {
			SendPong(msg, c)
			time.Sleep(constant.PING_INTERVAL * time.Millisecond)
			SendPing(msg, c)
		}
	}
}

func SendPong(msg *request.WsMessage, c *websocket.Conn) {
	tmp := request.PongMessage{
		ID:           msg.ID,
		OriginAction: "PONG",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func SendPing(msg *request.WsMessage, c *websocket.Conn) {
	tmp := request.PingMessage{
		ID:     msg.ID,
		Action: "PING",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func sendAuth(msg *request.WsMessage, token string, c *websocket.Conn) {
	tmp := request.AuthMessage{
		ID:           msg.ID,
		Action:       "PING",
		UserID:       "1245581001883648000",
		BrowserID:    uuid.New().String(),
		UserAgent:    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
		Timestamp:    time.Now().Format("20060102150405"),
		DeviceType:   "extension",
		Version:      "2.1.0",
		Token:        token,
		OriginAction: "AUTH",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func pingNetworkDevice(token, ip string) {
	client := resty.New()

	for {

		_, err := client.R().
			SetAuthToken(token).
			Get(fmt.Sprintf("%v/network/device-network?ip=%v", constant.BASE_URL, ip))
		if err != nil {
			log.Println("Can't ping device")
		}

		//fmt.Println("res", res)

		time.Sleep(1 * time.Second)
	}
}
