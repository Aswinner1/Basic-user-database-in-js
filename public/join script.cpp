//join script
#include <iostream>
#include <winsock2.h>
#include <Ws2tcpip.h>


const int SERVER_PORT = 49671;
const char* SERVER_IP = "10.28.2.117"; // Replace with actual server IP


const int BUFFER_SIZE = 1024;




int main() {
  WSADATA wsData;
  WORD ver = MAKEWORD(2, 2);




  // Initialize Winsock
  if (WSAStartup(ver, &wsData) != 0) {
      std::cerr << "Winsock initialization failed. Error: " << WSAGetLastError() << std::endl;
      return 1;
  }




  // Create client socket
  SOCKET clientSocket = socket(AF_INET, SOCK_STREAM, 0);
  if (clientSocket == INVALID_SOCKET) {
      std::cerr << "Socket creation failed. Error: " << WSAGetLastError() << std::endl;
      WSACleanup();
      return 1;
  }




  sockaddr_in serverAddress{};
  serverAddress.sin_family = AF_INET;
  serverAddress.sin_port = htons(SERVER_PORT);
  if (InetPtonA(AF_INET, SERVER_IP, &serverAddress.sin_addr.s_addr) != 1) {
      std::cerr << "IP address conversion failed. Error: " << WSAGetLastError() << std::endl;
      closesocket(clientSocket);
      WSACleanup();
      return 1;
  }




  // Connect to server
  if (connect(clientSocket, reinterpret_cast<sockaddr*>(&serverAddress), sizeof(serverAddress)) == SOCKET_ERROR) {
      std::cerr << "Failed to connect to server. Error: " << WSAGetLastError() << std::endl;
      closesocket(clientSocket);
      WSACleanup();
      return 1;
  }




  const char* password = "W1nner"; // Replace with the actual password
  send(clientSocket, password, strlen(password), 0);

  char buffer[BUFFER_SIZE];
  std::string command;
  while (true) {
      std::cout << "Enter command (type 'exit' to disconnect): ";
      std::getline(std::cin, command);




      if (command == "exit") {
          break;
      }




      send(clientSocket, command.c_str(), command.length(), 0);




      // Receiving response from the server
      int bytesReceived = recv(clientSocket, buffer, BUFFER_SIZE - 1, 0);
      if (bytesReceived > 0) {
          buffer[bytesReceived] = '\0'; // Null-terminate the received data
          std::cout << "Server: " << buffer << std::endl;
      } else if (bytesReceived == 0) {
          std::cout << "Server closed the connection." << std::endl;
          break;
      } else {
          std::cerr << "Failed to receive data. Error: " << WSAGetLastError() << std::endl;
          break;
      }
  }
  // Shutdown the connection before closing
  shutdown(clientSocket, SD_SEND);
  closesocket(clientSocket);
  WSACleanup();
  return 0;
}