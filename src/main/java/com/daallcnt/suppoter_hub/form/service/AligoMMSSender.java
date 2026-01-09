package com.daallcnt.suppoter_hub.form.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class AligoMMSSender {
    public void send(String receiver) throws IOException, InterruptedException {
        String endpoint = "https://apis.aligo.in/send/";

        String key = "w396k0h9ae3fqwrnzp4yk02zxznvoh3d";
        String userId = "supporterhub";

        ClassPathResource resource = new ClassPathResource("static/assets/images/welcome.jpg");
        byte[] fileBytes = resource.getInputStream().readAllBytes();
        String filename = "Logo.png";
        byte[] body = buildMultipartBody(
                Map.of(
                        "key", key,
                        "user_id", userId,
                        "sender", "01065872356",
                        "receiver", receiver,
                        "msg", "함께해요 관영 서포터즈에 가입해 주셔서 감사합니다.\n" +
                                "김관영 도지사의 일상적 활동이나 정책 등을 온라인으로 홍보하는 사람들이 모여 있는 팬클럽입니다.\n" +
                                "우리 함께 새로운 전북을 만들어 가는 데 주인이 됩시다.\n" +
                                "화이팅!",
                        "msg_type", "MMS",
                        "title", "함께해요 관영 서포터즈"
//                        "testmode_yn", "N"
                ),
                "image",filename, fileBytes
        );

        String boundary = LAST_BOUNDARY;

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.statusCode());
        System.out.println(res.body());
    }

    // ---- multipart helper ----
    private static String LAST_BOUNDARY;

    private static byte[] buildMultipartBody(Map<String,String> fields,
                                             String fileFieldName,
                                             String filename,
                                             byte[] fileBytes) throws IOException {
        String boundary = "----aligoBoundary" + UUID.randomUUID();
        LAST_BOUNDARY = boundary;

        var out = new java.io.ByteArrayOutputStream();

        for (var e : fields.entrySet()) {
            out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(("Content-Disposition: form-data; name=\"" + e.getKey() + "\"\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            out.write((e.getValue() + "\r\n").getBytes(StandardCharsets.UTF_8));
        }

        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + fileFieldName + "\"; filename=\"" + filename + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(fileBytes);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));

        out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }
}
