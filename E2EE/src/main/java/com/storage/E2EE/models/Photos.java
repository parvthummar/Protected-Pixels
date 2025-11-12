package com.storage.E2EE.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Photos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ownerUsername;
    private String filename;
    private String contentType;

    // New: where encrypted file is stored on disk
    private String storagePath;
}

