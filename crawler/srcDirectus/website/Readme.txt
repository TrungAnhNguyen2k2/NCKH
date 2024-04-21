Crawl website according sitemap
- Vào robots.txt get all sitemap link, thêm vài link sitemap khác, 
- Vào từng sitemap link rồi lấy all sitemaps link, lấy all link website
- Dùng package detect main content
- Sử dụng JSON+ld của website để detect các thông tin như type có phải là bài báo hay list bài báo, lấy postedAt, lấy imageLink
- Nếu jsonld không được thì lấy thêm thẻ meta và nội dung trong content
- Lọc theo lastmod, theo ngày của thẻ news, thẻ video 