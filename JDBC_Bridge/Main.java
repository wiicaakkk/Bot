import java.net.*;
import java.io.*;
import java.sql.*;
import java.util.*;
import org.json.JSONObject;

public class Main {
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

            System.out.println(body);
            
            
            Map<String, String> input = parseJson(body);
            System.out.println(input.toString());

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
        String url = "jdbc:oracle:thin:@127.0.0.1:40005/INOAN";
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

    private static Map<String, String> parseJson(String json) {
        Map<String, String> map = new HashMap<>();
        json = json.replaceAll("[{}\"]", "");
        for (String pair : json.split(",")) {
            String[] kv = pair.split(":", 2);
            if (kv.length == 2) map.put(kv[0].trim(), kv[1].trim());
        }
        return map;
    }

    

public class JSONUtil {

    public static void jsonParse(String jsonBody) {
        try {
            JSONObject json = new JSONObject(jsonBody);

            String query = json.getString("query");
            String user = json.getString("user");
            String password = json.getString("password");

            System.out.println("Query: " + query);
            System.out.println("User: " + user);
            System.out.println("Password: " + password);

        } catch (Exception e) {
            System.out.println("Error parsing JSON: " + e.getMessage());
        }
    }
}
}
