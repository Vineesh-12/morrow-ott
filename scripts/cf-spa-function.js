function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Serve the app entry point at the root
    if (uri === "/" || uri.endsWith("/")) {
        request.uri = "/index.html";
        return request;
    }
    
    // Keep real files, images, videos, and generated assets unchanged
    var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
    
    // Rewrite extensionless client-side routes to the SPA entry point
    if (lastSegment.indexOf(".") === -1) {
        request.uri = "/index.html";
    }
    
    return request;
}
