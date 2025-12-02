package com.storage.E2EE.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.storage.E2EE.models.Photos;

public interface PhotoRepository extends JpaRepository<Photos, Long> {
    List<Photos> findByOwnerUsername(String username);

    boolean existsByOwnerUsernameAndFilename(String ownerUsername, String filename);
}
