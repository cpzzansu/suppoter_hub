package com.daallcnt.suppoter_hub.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    String resourceLocations = "file:/Users/kimjunsu-minimac/appData/daallworks/localImages/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCachePeriod(3600)  // 캐싱 기간 설정
                .resourceChain(true)
                .addResolver(new org.springframework.web.servlet.resource.PathResourceResolver());
        // 서버 업로드 시 서버 파일 저장소로 변경
        registry.addResourceHandler("/images/**")
                .addResourceLocations(resourceLocations);

        registry.addResourceHandler("/videos/**")
                .addResourceLocations(resourceLocations);

        registry.addResourceHandler("/audios/**")
                .addResourceLocations(resourceLocations);
    }


    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

        registry.addViewController("/{spring:(?!api|static|actuator|assets|images|videos|audios)[^.]+}")
                .setViewName("forward:/");
        registry.addViewController("/**/{spring:(?!api|static|actuator|assets|images|videos|audios)[^.]+}")
                .setViewName("forward:/");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173/, https://xn----qd6ew2cx70c6uae40epc.com/, http://xn----qd6ew2cx70c6uae40epc.com/")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "HEAD")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
