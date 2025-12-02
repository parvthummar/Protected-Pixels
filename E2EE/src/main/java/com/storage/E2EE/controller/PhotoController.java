package com.storage.E2EE.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;

import com.storage.E2EE.services.PhotoService;
import com.storage.E2EE.models.Photos;
import com.storage.E2EE.dto.ErrorResponse;

import java.util.List;

@RestController
@RequestMapping("/api/secure/photos")
@CrossOrigin(origins = { "http://localhost:5173" }, allowedHeaders = "*", methods = { RequestMethod.GET,
        RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS })
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    // Already exists: upload(), download()
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws Exception {

        System.out.println("AUTH CHECK → " + SecurityContextHolder.getContext().getAuthentication());
        System.out.println("worked till 1");

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        System.out.println("worked till 2");

        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            username = userDetails.getUsername();
        } else {
            username = principal.toString();
        }
        System.out.println("worked till 3");

        // Check if filename already exists for this user
        String filename = file.getOriginalFilename();
        if (photoService.filenameExists(username, filename)) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                            "File with name '" + filename + "' already exists. Please rename the file and try again."));
        }

        photoService.savePhoto(username, file);
        return ResponseEntity.ok("Uploaded");
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<?> downloadFile(@PathVariable String filename) {
        try {
            String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

            byte[] fileData = photoService.getFile(username, filename);

            if (fileData == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body(fileData);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Failed to download file: " + e.getMessage()));
        }
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

        if (deleted)
            return ResponseEntity.ok("Deleted");
        return ResponseEntity.status(403).body("Not allowed");
    }
}
