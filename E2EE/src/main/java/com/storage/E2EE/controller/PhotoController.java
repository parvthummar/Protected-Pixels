package com.storage.E2EE.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;

import com.storage.E2EE.services.PhotoService;
import com.storage.E2EE.models.Photos;

import java.util.List;

@RestController
@RequestMapping("/api/secure/photos")
@CrossOrigin
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    // Already exists: upload(), download()
    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws Exception {

        System.out.println("AUTH CHECK → " + SecurityContextHolder.getContext().getAuthentication());

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            username = userDetails.getUsername();
        } else {
            username = principal.toString();
        }


        photoService.savePhoto(username, file);
        return "Uploaded";
    }


    @GetMapping("/list")
    public ResponseEntity<List<Photos>> listUserPhotos() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(photoService.listUserPhotos(username));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePhoto(@PathVariable Long id) {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        boolean deleted = photoService.deletePhoto(username, id);

        if (deleted) return ResponseEntity.ok("Deleted");
        return ResponseEntity.status(403).body("Not allowed");
    }
}
