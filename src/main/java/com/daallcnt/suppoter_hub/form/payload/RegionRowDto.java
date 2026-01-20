package com.daallcnt.suppoter_hub.form.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class RegionRowDto {
    private Long id;
    private String name;
    private String phone;
    private String address;

    private List<String> recommenderPath;
}
