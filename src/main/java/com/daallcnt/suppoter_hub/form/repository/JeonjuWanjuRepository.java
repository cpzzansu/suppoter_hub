package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JeonjuWanjuRepository extends JpaRepository<Suppoter, Long> {
    @Query("SELECT DISTINCT pageNumber FROM Suppoter where pageNumber is not null order by pageNumber")
    List<Integer> findPageNumberAll();

    Page<Suppoter> findByPageNumber(int pageNumber, Pageable pageable);

    List<Suppoter> findAllByPageNumber(int currentPage);
}
