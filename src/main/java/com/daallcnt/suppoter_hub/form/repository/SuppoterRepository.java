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
    WITH RECURSIVE
    down_tree AS (
      SELECT
        p.id  AS ancestor_id,
        c.id  AS descendant_id,
        CAST(CONCAT(p.id, ',', c.id) AS CHAR(2000)) AS path,
        1 AS depth
      FROM suppoter p
      JOIN suppoter c ON c.recommender_id = p.id
    
      UNION ALL
    
      SELECT
        dt.ancestor_id,
        c.id AS descendant_id,
        CONCAT(dt.path, ',', c.id) AS path,
        dt.depth + 1 AS depth
      FROM down_tree dt
      JOIN suppoter c ON c.recommender_id = dt.descendant_id
      WHERE dt.depth < 1000
        AND FIND_IN_SET(c.id, dt.path) = 0   -- 사이클 방지
    ),
    tot AS (
      SELECT ancestor_id AS id, COUNT(*) AS total_count
      FROM down_tree
      GROUP BY ancestor_id
    ),
    up_tree AS (
      SELECT
        s.id AS start_id,
        s.id AS current_id,
        s.recommender_id AS parent_id,
        CAST(s.id AS CHAR(2000)) AS path,
        0 AS depth
      FROM suppoter s
      JOIN tot ON tot.id = s.id
    
      UNION ALL
    
      SELECT
        ut.start_id,
        p.id AS current_id,
        p.recommender_id AS parent_id,
        CONCAT(ut.path, ',', p.id) AS path,
        ut.depth + 1 AS depth
      FROM up_tree ut
      JOIN suppoter p ON p.id = ut.parent_id
      WHERE ut.depth < 1000
        AND FIND_IN_SET(p.id, ut.path) = 0  
    ),
    
    roots AS (
      SELECT start_id, current_id AS root_id
      FROM up_tree
      WHERE parent_id IS NULL
    )
    
    SELECT
      CAST(ROW_NUMBER() OVER (ORDER BY tot.total_count DESC) AS SIGNED) AS ranking,
      s.name AS name,
      COALESCE(root.name, s.name) AS rootName,
      tot.total_count AS recommendedCount
    FROM tot
    JOIN suppoter s ON s.id = tot.id
    LEFT JOIN roots r ON r.start_id = s.id
    LEFT JOIN suppoter root ON root.id = r.root_id
    WHERE tot.total_count >= ?       
    ORDER BY tot.total_count DESC;
    """, nativeQuery = true)
    List<RecommendRankView> findRecommendersRankWithRoot(@Param("min") long min);
}
