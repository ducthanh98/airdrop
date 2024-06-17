package main

import (
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/spf13/cast"
	"github.com/spf13/viper"
	"grass/constant"
	"grass/request"
	"log"
	"time"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	token := viper.GetString("data.token")

	go pingNetworkDevice(token)
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
			time.Sleep(constant.PING_INTERVAL * time.Minute)
			sendPing(c)
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

func sendPing(c *websocket.Conn) {

	tmp := request.PingRequest{
		ID:      uuid.New().String(),
		Action:  "PING",
		Version: "1.0.0",
		Data:    struct{}{},
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func sendAuth(msg *request.WsMessage, token string, c *websocket.Conn) {
	deviceId := viper.GetString("data.deviceId")
	userId := viper.GetString("data.userId")

	tmp := request.AuthRequest{
		ID:           msg.ID,
		OriginAction: "AUTH",
		Result: request.AuthData{
			BrowserID:  deviceId,
			UserID:     userId,
			UserAgent:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
			Timestamp:  cast.ToInt(time.Now().Format("20060102150405")),
			DeviceType: "extension",
			Version:    "4.0.3",
		},
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}

	sendPing(c)
}

func pingNetworkDevice(token string) {
	client := resty.New()

	for {

		_, err := client.R().
			SetAuthToken(token).
			Get(fmt.Sprintf("%v/data/client-ip", constant.BASE_URL))
		if err != nil {
			log.Println("Can't ping device")
		}

		//fmt.Println("res", res)

		time.Sleep(10 * time.Second)
	}
}
