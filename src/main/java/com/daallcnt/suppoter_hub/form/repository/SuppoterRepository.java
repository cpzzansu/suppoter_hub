package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SuppoterRepository extends JpaRepository<Suppoter, Long> {
    List<Suppoter> findByName(String recommendName);


    List<Suppoter> findByPageNumberAndRecommenderIsNull(int pageNumber);

    @Query("SELECT DISTINCT pageNumber FROM Suppoter where pageNumber is not null order by pageNumber")
    List<Integer> findPageNumberAll();

    List<Suppoter> findByRecommendContaining(String keyword);

    boolean existsByPhone(String phone);

    List<Suppoter> findByRecommenderIsNullAndRecommendNot(String recommend);
}
