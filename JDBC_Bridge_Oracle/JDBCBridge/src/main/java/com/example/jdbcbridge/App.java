package com.example.jdbcbridge;

import java.net.ServerSocket;
import java.net.Socket;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.Map;

import org.json.JSONObject;
import java.util.HashMap;
/**
 * Hello world!
 *
 */
public class App 
{
    public static void main(String[] args) throws Exception {
        ServerSocket serverSocket = new ServerSocket(4567);
        System.out.println("🚀 JDBC Proxy running on http://localhost:4567");

        while (true) {
            Socket socket = serverSocket.accept();
            handleRequest(socket);
        }
    }

    private static void handleRequest(Socket socket) {
        try (
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()));
        ) {
            // Skip headers, grab body (very naive parser)
            String line;
            int contentLength = 0;
            while (!(line = reader.readLine()).isEmpty()) {
                if (line.toLowerCase().startsWith("content-length:")) {
                    contentLength = Integer.parseInt(line.split(":")[1].trim());
                }
            }

            char[] bodyChars = new char[contentLength];
            reader.read(bodyChars);
            String body = new String(bodyChars);
            // System.out.println(body);
            Map<String, String> input = jsonParse(body);
            // System.out.println(input.toString());

            System.out.println(input.get("query"));
            String response = runQuery(input.get("query"), input.get("user"), input.get("password"));

            writer.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n");
            writer.write(response);
            writer.flush();
            socket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String runQuery(String query, String user, String password) {
        String url = "jdbc:oracle:thin:@127.0.0.1:40001/INOAN";
        StringBuilder result = new StringBuilder("[");
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();

            while (rs.next()) {
                result.append("{");
                for (int i = 1; i <= colCount; i++) {
                    result.append("\"").append(meta.getColumnName(i)).append("\":");
                    result.append("\"").append(rs.getString(i)).append("\"");
                    if (i < colCount) result.append(",");
                }
                result.append("},");
            }
            if (result.charAt(result.length() - 1) == ',') result.setLength(result.length() - 1);
            result.append("]");
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}";
        }

        return result.toString();
    }

    // private static Map<String, String> parseJson(String json) {
    //     Map<String, String> map = new HashMap<>();
    //     json = json.replaceAll("[{}\"]", "");
    //     for (String pair : json.split(",")) {
    //         String[] kv = pair.split(":", 2);
    //         if (kv.length == 2) map.put(kv[0].trim(), kv[1].trim());
    //     }
    //     return map;
    // }

    public static HashMap<String, String> jsonParse(String jsonBody) {
        HashMap<String, String> result = new HashMap<>();
        try {
            JSONObject json = new JSONObject(jsonBody);

            result.put("query", json.getString("query"));
            result.put("user", json.getString("user"));
            result.put("password", json.getString("password"));

        } catch (Exception e) {
            System.out.println("Error parsing JSON: " + e.getMessage());
        }

        return result;
    }
}
