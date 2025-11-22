FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

ARG VITE_API_URL=http://localhost:8000
ARG VITE_APP_NAME=StitchDentistryWeb
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
