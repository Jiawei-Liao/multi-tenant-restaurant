package com.multitenantrestaurant.api.common.image;

import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.*;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Component;
import com.luciad.imageio.webp.WebPWriteParam;

@Component
public class WebpImageConverter {

    public byte[] toWebp(byte[] input) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(input));
        if (image == null) {
            throw new IOException("Unreadable image data");
        }

        ImageWriter writer = ImageIO.getImageWritersByMIMEType("image/webp").next();
        WebPWriteParam writeParam = new WebPWriteParam(writer.getLocale());
        writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        writeParam.setCompressionType("Lossy");
        writeParam.setCompressionQuality(0.8f);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), writeParam);
            writer.dispose();
            return baos.toByteArray();
        }
    }
}
