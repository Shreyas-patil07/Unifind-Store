# ImageService.uploadMultiple() Test Scenarios

## Test Scenario 1: Successful Parallel Upload
**Input**: 3 valid image files (file1.jpg, file2.png, file3.webp)

**Expected Behavior**:
1. All 3 files are validated (type, size)
2. All 3 files are compressed in parallel
3. All 3 files are uploaded to Cloudinary concurrently
4. Method returns array of 3 URLs

**Timeline** (parallel execution):
```
Time 0ms:   Start upload file1, file2, file3
Time 500ms: file1 compressed
Time 520ms: file2 compressed
Time 510ms: file3 compressed
Time 1500ms: file1 uploaded → url1
Time 1600ms: file2 uploaded → url2
Time 1550ms: file3 uploaded → url3
Time 1600ms: Return ['url1', 'url2', 'url3']
```

**Total Time**: ~1600ms (vs ~4800ms sequential)

---

## Test Scenario 2: Partial Failure (Network Error)
**Input**: 3 valid image files (file1.jpg, file2.png, file3.webp)
**Condition**: file2 upload fails due to network timeout

**Expected Behavior**:
1. All 3 files start uploading in parallel
2. file1 and file3 upload successfully
3. file2 fails with network error
4. Error is logged to console
5. Method returns array of 2 URLs (successful uploads only)

**Result**:
```javascript
// Console output:
"Failed to upload file 2: Network error during image upload"
"2 upload(s) failed: [{ success: false, error: '...', index: 1 }]"

// Return value:
['url1', 'url3']
```

**User Impact**: Product can still be created with 2 images instead of 3

---

## Test Scenario 3: Validation Failure
**Input**: 3 files (file1.jpg [valid], file2.pdf [invalid type], file3.jpg [valid])

**Expected Behavior**:
1. file1 validation passes → uploads successfully
2. file2 validation fails → error logged
3. file3 validation passes → uploads successfully
4. Method returns array of 2 URLs

**Result**:
```javascript
// Console output:
"Failed to upload file 2: Only JPEG, PNG, and WebP images are supported"

// Return value:
['url1', 'url3']
```

---

## Test Scenario 4: All Uploads Fail
**Input**: 3 valid image files
**Condition**: Cloudinary configuration is missing

**Expected Behavior**:
1. All 3 uploads fail with same error
2. All errors are logged
3. Method returns empty array

**Result**:
```javascript
// Console output:
"Failed to upload file 1: Cloudinary cloud name not configured"
"Failed to upload file 2: Cloudinary cloud name not configured"
"Failed to upload file 3: Cloudinary cloud name not configured"
"3 upload(s) failed: [...]"

// Return value:
[]
```

**User Impact**: Product form should display error and prevent submission

---

## Test Scenario 5: Single File Upload
**Input**: 1 valid image file

**Expected Behavior**:
1. File is validated and compressed
2. File is uploaded to Cloudinary
3. Method returns array with 1 URL

**Result**:
```javascript
['url1']
```

**Note**: Works identically to calling `upload()` directly, but returns array

---

## Test Scenario 6: Empty Array
**Input**: Empty array `[]`

**Expected Behavior**:
1. Validation fails immediately
2. Error is thrown

**Result**:
```javascript
// Throws error:
"Files must be a non-empty array"
```

---

## Test Scenario 7: Maximum Images (5 files)
**Input**: 5 valid image files

**Expected Behavior**:
1. All 5 files upload in parallel
2. Method returns array of 5 URLs

**Result**:
```javascript
['url1', 'url2', 'url3', 'url4', 'url5']
```

**Performance**: ~1.5-2x faster than sequential upload

---

## Performance Comparison

### Sequential Upload (old approach):
```
File 1: 0ms → 1500ms (1500ms)
File 2: 1500ms → 3000ms (1500ms)
File 3: 3000ms → 4500ms (1500ms)
Total: 4500ms
```

### Parallel Upload (new approach):
```
File 1: 0ms → 1500ms
File 2: 0ms → 1600ms
File 3: 0ms → 1550ms
Total: 1600ms (max of all uploads)
```

**Improvement**: ~65% faster for 3 images

---

## Integration with Product Form

**Typical Usage Flow**:
```javascript
// 1. User selects 3 images in product form
const selectedFiles = [file1, file2, file3];

// 2. Form submission handler
async function handleSubmit(e) {
  e.preventDefault();
  setUploading(true);
  
  try {
    // 3. Upload images in parallel
    const imageUrls = await imageService.uploadMultiple(selectedFiles, 'product');
    
    // 4. Check if at least 1 image uploaded
    if (imageUrls.length === 0) {
      throw new Error('Failed to upload any images');
    }
    
    // 5. Create product with successful URLs
    const productData = {
      ...formData,
      images: imageUrls,
    };
    
    // 6. Submit to backend
    await api.post('/products', productData);
    
    // 7. Navigate to success page
    navigate('/seller');
  } catch (error) {
    setError(error.message);
  } finally {
    setUploading(false);
  }
}
```

---

## Error Handling Strategy

The `uploadMultiple()` method uses a **graceful degradation** strategy:

1. **Individual Failures**: Don't block other uploads
2. **Partial Success**: Return successful URLs even if some fail
3. **Complete Failure**: Return empty array (caller handles error)
4. **Logging**: All failures are logged for debugging

This ensures the best possible user experience:
- If 2 of 3 images upload, product can still be created
- User is informed about failures via console logs
- Form can display appropriate error messages
- No silent failures
