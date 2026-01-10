package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.RecommendRankView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<Suppoter> findByRecommenderIsNullAndRecommendIsNotNull();

    @Query(value = """
    WITH RECURSIVE anc AS (
        SELECT s.id AS start_id, s.id AS current_id, s.recommender_id AS parent_id
        FROM suppoter s
        UNION ALL
        SELECT anc.start_id, p.id AS current_id, p.recommender_id AS parent_id
        FROM anc
        JOIN suppoter p ON p.id = anc.parent_id
    ),
    roots AS (
        SELECT start_id, current_id AS root_id
        FROM anc
        WHERE parent_id IS NULL
    ),
    cnt AS (
        SELECT recommender_id AS id, COUNT(*) AS recommended_count
        FROM suppoter
        WHERE recommender_id IS NOT NULL
        GROUP BY recommender_id
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY cnt.recommended_count DESC) AS ranking,
        s.name AS name,
        COALESCE(root.name, s.name) AS rootName,
        cnt.recommended_count AS recommendedCount
    FROM cnt
    JOIN suppoter s ON s.id = cnt.id
    LEFT JOIN roots r ON r.start_id = s.id
    LEFT JOIN suppoter root ON root.id = r.root_id
    WHERE cnt.recommended_count >= :min
    ORDER BY cnt.recommended_count DESC
    """, nativeQuery = true)
    List<RecommendRankView> findRecommendersRankWithRoot(@Param("min") long min);
}
