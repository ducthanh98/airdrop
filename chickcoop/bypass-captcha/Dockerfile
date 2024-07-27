# Stage 1: Build the Go application
FROM jjanzic/docker-python3-opencv

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY . .
RUN pip3 install flask

EXPOSE 5005

# Command to run the executable
CMD ["python3","main.py"]