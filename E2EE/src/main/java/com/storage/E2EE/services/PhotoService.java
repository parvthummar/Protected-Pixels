package com.storage.E2EE.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.storage.E2EE.repositories.PhotoRepository;
import com.storage.E2EE.models.Photos;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@Service
public class PhotoService {

    @Autowired
    private PhotoRepository photoRepository;

    // Check if filename exists for user
    public boolean filenameExists(String username, String filename) {
        return photoRepository.existsByOwnerUsernameAndFilename(username, filename);
    }

    // Get file contents by filename for user (optimized with direct query)
    public byte[] getFile(String username, String filename) throws Exception {
        Photos photo = photoRepository.findByOwnerUsernameAndFilename(username, filename);

        if (photo == null) {
            return null;
        }

        File file = new File(photo.getStoragePath());
        if (!file.exists()) {
            return null;
        }

        return Files.readAllBytes(Paths.get(photo.getStoragePath()));
    }

    public List<Photos> listUserPhotos(String username) {
        return photoRepository.findByOwnerUsername(username);
    }

    public boolean deletePhoto(String username, Long id) {
        Photos p = photoRepository.findById(id).orElse(null);
        if (p == null)
            return false;

        // Prevent deleting someone else's file
        if (!p.getOwnerUsername().equals(username))
            return false;

        File file = new File(p.getStoragePath());
        if (file.exists())
            file.delete();

        photoRepository.delete(p);
        return true;
    }

    public void savePhoto(String username, MultipartFile file) throws Exception {
        String folder = "uploads/" + username;
        File dir = new File(folder);
        if (!dir.exists())
            dir.mkdirs();

        String filePath = folder + "/" + file.getOriginalFilename();
        Files.write(Paths.get(filePath), file.getBytes());

        Photos photo = new Photos();
        photo.setOwnerUsername(username);
        photo.setFilename(file.getOriginalFilename());
        photo.setContentType(file.getContentType());
        photo.setStoragePath(filePath);
        photoRepository.save(photo);
    }
}
