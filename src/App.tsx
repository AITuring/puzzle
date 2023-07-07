import React, { useState, useEffect, useRef } from "react";

import "./styles.css";

const ItemTypes = {
  IMAGE: "image"
};

const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [combine, setCombine] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files!.length > 16) {
      setImages(files.slice(0, 16));
    } else {
      setImages(files);
    }
    // 自动开启生成
    setCombine(true);
  };

  const handleImageDelete = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  useEffect(() => {
    if (combine) {
      const loadedImages: HTMLImageElement[] = [];

      Promise.all(
        images.map((image) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(image);
            img.onload = () => {
              loadedImages.push(img);
              resolve(img);
            };
            img.onerror = (error) => reject(error);
          });
        })
      )
        .then(() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");

          if (!canvas || !ctx) {
            return;
          }

          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;

          const imageWidth = canvasWidth / 4;
          const imageHeight = canvasHeight / 4;

          let x = 0;
          let y = 0;

          loadedImages.forEach((img) => {
            const { width, height } = img;

            // 计算图片缩放比例
            const scale = Math.min(imageWidth / width, imageHeight / height);

            // 计算缩放后的宽度和高度
            const scaledWidth = width * scale;
            const scaledHeight = height * scale;

            // 计算在画布上绘制的起始位置
            const offsetX = (imageWidth - scaledWidth) / 2;
            const offsetY = (imageHeight - scaledHeight) / 2;

            ctx.drawImage(
              img,
              0,
              0,
              width,
              height,
              x + offsetX,
              y + offsetY,
              scaledWidth,
              scaledHeight
            );
            // 新方法，但是裁切的内容不对
            // ctx.drawImage(
            //   img,
            //   0,
            //   0,
            //   scaledWidth,
            //   scaledHeight,
            //   x + offsetX,
            //   y + offsetY,
            //   imageWidth,
            //   imageHeight
            // );

            x += imageWidth;
            if (x >= canvasWidth) {
              x = 0;
              y += imageHeight;
            }
          });
          setCombine(false);
          // 将画布转换为图片并下载
          const dataURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataURL;
          link.download = "combined-image.png";
          link.click();
        })
        .catch((error) => {
          console.log("Error loading images:", error);
        });
    }
  }, [combine]);

  const renderImages = () => {
    return images.map((image, index) => (
      <div key={index}>
        <img
          src={URL.createObjectURL(image)}
          alt={`Image ${index}`}
          style={{ width: "100px" }}
        />
        <button onClick={() => handleImageDelete(index)}>Delete</button>
      </div>
    ));
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
      />
      {renderImages()}
      {images.length < 16 && (
        <p>{`You need to upload ${16 - images.length} more image(s).`}</p>
      )}
      {/* <button onClick={() => setCombine(true)}>
            Combine Images
          </button> */}
      <canvas ref={canvasRef} width={4800} height={4800} />
    </div>
  );
};

export default App;
