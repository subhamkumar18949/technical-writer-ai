FROM ollama/ollama:latest

WORKDIR /app

# Copy all Modelfiles into the image
COPY Modelfile.docs Modelfile.ux Modelfile.web Modelfile.blog Modelfile.humanizer ./

# Copy and prepare the startup script
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 11434

CMD ["/app/start.sh"]
