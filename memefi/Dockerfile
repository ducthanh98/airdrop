# Use the official Python image from the Docker Hub
FROM python:3.12.3-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file into the container at /app
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to /app
COPY . /app

# Run the application
CMD ["python", "app.py"]