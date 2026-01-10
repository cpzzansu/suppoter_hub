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

            WITH
               cnt AS (
                   SELECT recommender_id AS id, COUNT(*) AS recommended_count
                   FROM suppoter
                   WHERE recommender_id IS NOT NULL
                   GROUP BY recommender_id
                   HAVING COUNT(*) >= ?
               ),
               RECURSIVE anc AS (
               SELECT
               s.id AS start_id,
               s.id AS current_id,
               s.recommender_id AS parent_id,
               CAST(s.id AS CHAR(2000)) AS path,
               0 AS depth
               FROM suppoter s
               JOIN cnt ON cnt.id = s.id
           
               UNION ALL
           
               SELECT
               anc.start_id,
               p.id AS current_id,
               p.recommender_id AS parent_id,
               CONCAT(anc.path, ',', p.id) AS path,
               anc.depth + 1 AS depth
               FROM anc
               JOIN suppoter p ON p.id = anc.parent_id
               WHERE anc.depth < 1000
               AND FIND_IN_SET(p.id, anc.path) = 0 \s
               ),
               roots AS (
               SELECT start_id, current_id AS root_id
               FROM anc
               WHERE parent_id IS NULL
               )
           SELECT
               CAST(ROW_NUMBER() OVER (ORDER BY cnt.recommended_count DESC) AS SIGNED) AS ranking,
               s.name AS name,
               COALESCE(root.name, s.name) AS rootName,   \s
               cnt.recommended_count AS recommendedCount
           FROM cnt
                    JOIN suppoter s ON s.id = cnt.id
                    LEFT JOIN roots r ON r.start_id = s.id
                    LEFT JOIN suppoter root ON root.id = r.root_id
           ORDER BY cnt.recommended_count DESC;
    """, nativeQuery = true)
    List<RecommendRankView> findRecommendersRankWithRoot(@Param("min") long min);
}
