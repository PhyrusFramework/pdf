
class PDF {

    static generate(options = {}) {

        return new Promise((resolve, reject) => {

            //In IE these libraries doesn't work, so an alert is displayed.
            var ua = window.navigator.userAgent;
            if (ua.indexOf("MSIE") >= 0 || ua.indexOf("Trident/") >= 0) {
                alert("PDF Download not supported by this browser");
                return;
            }
            ////////
            
            //// Initialize options
            let ops = { // defaults
                    
                    // Container to print
                    container: "body",
                    
                    // Elements that you won't let be cut by the page ending.
                    nonBreakables: null,
                    
                    // Margen until the page ending
                    cutMargin: options.cutMargin ? options.cutMargin : (options.nonBreakables ? 15 : 0),
                    
                    // Name of the generated pdf
                    fileName: "document",
                    
                    // Page background color
                    backgroundColor: {
                        r: 255,
                        g: 255,
                        b: 255
                    }
                    
            };
            if (options) {
                Object.keys(options).forEach( function(k) {
                    ops[k] = options[k];
                });
            }
            //////
            
            let container = $(ops.container);
            
            let onCanvas = function(doc, canvas) {  
                
                // Image to print into the PDF
                var imgData = canvas.toDataURL('image/jpeg');
                
                // Create document
                let pageWidth = doc.internal.pageSize.getWidth();
                let pageHeight = doc.internal.pageSize.getHeight();
                let imageHeight = (canvas.height * pageWidth)/canvas.width;
                
                let originY = container.offset().top;
                let currentOrigin = originY;
                let breakPoints = [0];
                let restingHeight = imageHeight;
                
                // px to mm conversion
                let px2mm = pageWidth /*mm*/ / container.width() /*px*/;
                
                let margin = ops.cutMargin * px2mm;
                
                // Obtain break points from nonBreakables
                if (ops.nonBreakables) {
                    let items = container.find(ops.nonBreakables);
                    
                    let lastPoint = 0;
                    for(let n = 0; n<items.length; ++n) {
                        
                        let item = items.eq(n);
                        
                        let itemHeight = item.height();
                        
                        let offset = (item.offset().top - currentOrigin);
                        let itemTop = offset * px2mm;

                        let itemBottom = (offset + itemHeight) * px2mm; 
                        let itemAbsoluteTop = (item.offset().top - originY) * px2mm;
                        
                        let counter = 1; // to prevent infinite loop, max 5 iterations.
                        while (itemTop > pageHeight) {
                            
                            breakPoints.push(breakPoints[breakPoints.length - 1] + pageHeight * counter);
                            ++counter;
                            
                            if (counter >= 5) break;
                            
                            currentOrigin += pageHeight * 1/px2mm;
                            offset = (item.offset().top - currentOrigin);
                            itemTop = offset * px2mm;
                            itemBottom = (offset + itemHeight) * px2mm; 
                            
                        }
                        
                        if (itemTop - 10 < pageHeight && itemBottom + 10 > pageHeight) {
                            
                            if (Math.abs(itemAbsoluteTop - lastPoint) < pageHeight/2) {
                                continue;
                            }
                            lastPoint = itemAbsoluteTop;

                            breakPoints.push(lastPoint - margin);
                            
                            restingHeight -= itemTop;
                            
                            currentOrigin += offset;
                            
                            if (restingHeight < pageHeight) {
                                break;
                            }
                            
                        }
                        
                    }
                }
                
                let last = breakPoints[breakPoints.length - 1];
                while(imageHeight - last > pageHeight) {
                    last = last + pageHeight;
                    breakPoints.push(last);
                }
                
                let initialPage = doc.internal.pages.length;
                
                for(let i = 0; i<breakPoints.length; ++i) {
                    let point = breakPoints[i];
                    
                    if (imageHeight - point < 3) {
                        break;
                    }
                    
                    if(i > 0){
                        doc.addPage();
                        doc.setPage(initialPage + i+1);
                    }
                    
                    doc.addImage(imgData, 'JPEG', 0, - point, pageWidth, imageHeight);
                    
                    let diff = pageHeight;
                    if (i < breakPoints.length - 1) {
                        diff = breakPoints[i + 1] - point;
                    }
                    
                    if (diff < pageHeight) {
                        doc.setDrawColor(ops.backgroundColor.r, ops.backgroundColor.g, ops.backgroundColor.b);
                        doc.setFillColor(ops.backgroundColor.r, ops.backgroundColor.g, ops.backgroundColor.b);
                        doc.rect(0, diff, pageWidth, pageHeight - diff, 'FD');
                    }
                }
                
            };
            
            let startProcess = function(pdf, containers, position) {
                
                html2canvas(containers[position], {scale: 1})
                .then(function(canvas) {
                    body.css('overflow', currentOverflow);
                    onCanvas(pdf, canvas);
                    
                    if (position < containers.length - 1) {
                        pdf.addPage();
                        pdf.setPage( pdf.internal.pages.length );
                        startProcess(pdf, containers, position + 1);
                    } else {
                        pdf.save(ops.fileName + '.pdf');
                        resolve(ops.fileName + '.pdf');
                    }
                })
                .catch(function(err) {	    
                    reject(err);
                });
            }
            ///
            
            window.scrollTo(0,0);
            
            // Scrollbar causes an 8px displacement to the PDF,
            // so we hide scrollbars and display them again after.
            let body = $("body");
            let currentOverflow = body.css('overflow');
            body.css('overflow', 'hidden');
            
            setTimeout( function() {
                
                let doc = new jsPDF();
                startProcess(doc, container, 0);

            }, 50);

        });
    }

}