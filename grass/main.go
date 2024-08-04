package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/spf13/cast"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/net/proxy"
	"grass/constant"
	"grass/request"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

var logger *zap.Logger

func main() {
	config := zap.NewDevelopmentConfig()
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	logger, _ = config.Build()

	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	token := viper.GetString("data.token")
	proxies := viper.GetStringSlice("data.proxies")
	deviceIds := viper.GetStringSlice("data.deviceids")

	for i := 0; i < len(proxies); i++ {
		//go pingNetworkDevice(token, proxies[i])
		go connectSocket(token, proxies[i], deviceIds[i])
		break
	}

	select {}

}

func connectSocket(token string, proxyURL string, deviceId string) {
	// Proxy URL with authentication
	proxyURL = "socks5://proxymart29244:zmpNhlFg@154.196.92.244:29244"

	// WebSocket server address
	wsServerAddress := constant.BASE_WSS // Change this to your WebSocket server address

	// Manually parse the proxy URL
	proxyParts := strings.Split(proxyURL, "@")
	if len(proxyParts) != 2 {
		fmt.Fprintln(os.Stderr, "Invalid proxy URL format")
		return
	}

	authParts := strings.Split(strings.TrimPrefix(proxyParts[0], "socks5://"), ":")
	if len(authParts) != 2 {
		fmt.Fprintln(os.Stderr, "Invalid proxy authentication format")
		return
	}

	proxyAuth := &proxy.Auth{
		User:     authParts[0],
		Password: authParts[1],
	}

	proxyAddress := proxyParts[1]

	// Create a SOCKS5 dialer with authentication
	dialer, err := proxy.SOCKS5("tcp", proxyAddress, proxyAuth, proxy.Direct)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Failed to create SOCKS5 dialer:", err)
		return
	}

	// Create a custom HTTP client that uses the SOCKS5 dialer
	httpTransport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return dialer.Dial(network, addr)
		},
	}

	// Basic authentication credentials for WebSocket (not the proxy)
	username := "your_username" // Change this to your username
	password := "your_password" // Change this to your password

	// Create the basic authentication header
	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(username+":"+password))

	// Prepare custom HTTP headers
	headers := http.Header{}
	headers.Set("Authorization", authHeader)

	// Create the WebSocket dialer
	wsDialer := websocket.Dialer{
		NetDialContext: httpTransport.DialContext,
	}

	// Establish the WebSocket connection
	c, resp, err := wsDialer.DialContext(context.Background(), wsServerAddress, headers)
	if err != nil {
		fmt.Printf("handshake failed with status", resp)
		fmt.Printf("dial:", err)
		log.Println(" Reconnecting after a minute")
		time.Sleep(5 * time.Second)
		go connectSocket(token, proxyURL, deviceId)
	}
	defer c.Close()
	for {
		_, payload, err := c.ReadMessage()
		if err != nil {
			log.Println("Read message error:", err)
			time.Sleep(5 * time.Second)
			log.Println("Error. Reconnecting after a minute")
			go connectSocket(token, proxyURL, deviceId)
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

func sendAuth(msg *request.WsMessage, deviceId string, c *websocket.Conn) {
	userId := viper.GetString("data.userId")

	//tmp := request.AuthRequest{
	//	ID:           msg.ID,
	//	OriginAction: "AUTH",
	//	Result: request.AuthData{
	//		BrowserID:  deviceId,
	//		UserID:     userId,
	//		UserAgent:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
	//		Timestamp:  cast.ToInt(time.Now().Format("20060102150405")),
	//		DeviceType: "extension",
	//		Version:    "4.0.3",
	//	},
	//}

	tmp := request.AuthRequestCommunity{
		ID:           msg.ID,
		OriginAction: "AUTH",
		Result: request.ResultCommunity{
			BrowserID:   deviceId,
			UserID:      userId,
			UserAgent:   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
			Timestamp:   cast.ToInt(time.Now().Format("20060102150405")),
			DeviceType:  "extension",
			Version:     "4.20.2",
			ExtensionID: "lkbnfiajjmbhnfledhphioinpickokdi",
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

func pingNetworkDevice(token string, proxyUrl string) {
	client := resty.New()
	client.SetProxy(proxyUrl)

	for {

		res, err := client.R().
			SetAuthToken(token).
			Get(fmt.Sprintf("%v/data/client-ip", constant.BASE_URL))
		if err != nil {
			log.Println(proxyUrl, "Can't ping device")
		}

		fmt.Println("res", res)

		time.Sleep(10 * time.Second)
	}
}
