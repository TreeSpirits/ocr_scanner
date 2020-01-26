



FileUploader = function () {

    function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

            // Only process image files.
            if (!f.type.match('image.*')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    var span = document.createElement('span');
                    span.innerHTML = ['<img class="thumb" src="', e.target.result,
                        '" title="', escape(theFile.name), '"/>'].join('');
                    document.getElementById('list').insertBefore(span, null);
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsDataURL(f);
        }
    }

    return {
        init: function () {
            document.getElementById('files').addEventListener('change', handleFileSelect, false);
        }
    }

}();




OCR = function () {

    let ocr_result = {};
    let test = null;

    let canvas = document.getElementById('canvas')

    let ctx, bufferCanvas;

    function process() {
        $('#result').text('') // v2
        $('#result_image').children().detach()


        let image = new Image()
        // image.src = 'card3.jpg'
        // image.src = './sample_images/invoice_scan1.jpg'
        image.src = $('img.active').attr('src')
        image.style.display = 'none'
        image.onload = function () {
            console.log('loadddding')
            console.log('image width height', this.width, this.height)

            canvas.width = this.width;
            canvas.height = this.height;
            ctx = canvas.getContext('2d')

            ctx.drawImage(this, 0, 0);

            bufferCanvas = document.createElement('canvas')
            let bufferContext = bufferCanvas.getContext('2d')

            bufferCanvas.width = this.width
            bufferCanvas.height = this.height

            bufferContext.drawImage(canvas, 0, 0, this.width, this.height, 0, 0, this.width, this.height)
            // console.log('buffercanvas', bufferCanvas.toDataURL())

            // document.getElementById('cropped').src = bufferCanvas.toDataURL()

            var result_el = document.getElementById('result_image');
            result_el.appendChild(bufferCanvas)

            $.blockUI({message:'<i class="fa fa-spinner fa-spin"></i> Processing...'})

            Tesseract.recognize(bufferCanvas.toDataURL())
                .then((result) => {
                    console.log("teserract result", result)

                    // $('#result').text(result.text) // v1
                    $('#result').text(result.data.text) // v2

                    ocr_result = result;

                    annotateResult(result);

                })
                .catch(function () {
                    alert('Failed to process')
                })
                .finally(() => {
                    $.unblockUI()
                })
        }

    }

    function annotateResult(ocr_result) {

        ocr_result.data.words.forEach(word => {

            console.log('Drawing', word)

            var top = word.bbox['y0'];
            var left = word.bbox['x0'];
            var width = word.bbox['x1'] - word.bbox['x0']
            var height = word.bbox['y1'] - word.bbox['y0']

            // create bounding rectangle div
            var rect = document.createElement('div')

            // add poistion, height and width
            rect.style.top = `${top}px`;
            rect.style.left = `${left}px`;
            rect.style.width = `${width}px`;
            rect.style.height = `${height}px`;

            // add class
            var classNames = ['rectangle'];
            if (word.confidence > 80) {
                classNames.push('green-border')
            }
            else if (word.confidence > 65) {
                classNames.push('blue-border')
            }
            else {
                classNames.push('red-border')
            }

            rect.className = classNames.join(' ')

            // set attributes
            rect.setAttribute('title', word.text);
            rect.setAttribute('data-content', `Confidence: ${word.confidence}`);
            rect.setAttribute('data-trigger', `hover`);



            // rect add text
            //

            result_image.appendChild(rect)

            $('.rectangle').popover()


        })

    }

    return {
        process: process
    }

}();

Page = function () {
    function initClickListeners() {
        $(document).on('click', 'img.thumb', function () {
            $('.thumb').removeClass('active')
            $(this).addClass('active');
            OCR.process()
        });

        $('#zoom_in').on('click',zoomIn)
        $('#zoom_out').on('click',zoomOut)

    }

    function zoomIn() {
        console.log('zooming in')
        zoom('in')

    }

    function zoomOut() {
        console.log('zooming out')
        zoom()

    }

    function zoom(type) {

        var increment = -0.1;
        if (type == 'in') {
            increment = 0.1;
        }

        var $el = $('#result_image');

        var current_zoom = parseFloat($el.css('zoom'));
        var new_zoom = current_zoom + increment;

        $el.css('zoom', new_zoom)
    }

    return {
        init: function () {
            initClickListeners();
            FileUploader.init()

        },
        zoomIn: zoomIn,
        zoomOut: zoomOut

    }

}()


$(document).ready(function(){
    Page.init()
})


// initDraw(document.getElementById('canvas'));




// Note to self use this to setup drawing on canvas
// http://jsfiddle.net/d9BPz/546/