# Stage 1: Build the Go application
FROM golang:1.21.4 AS builder

# Set the Current Working Directory inside the container
WORKDIR /app
ENV CGO_ENABLED=0

# Copy go mod and sum files
COPY go.mod go.sum ./
# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY .. .

# Build the Go app
RUN go build -o main .

# Stage 2: Create a smaller image for running the application
FROM alpine:latest

# Set the Current Working Directory inside the container
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

# Command to run the executable
CMD ["./main"]