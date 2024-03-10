function debug() {
    console.log("Debugger activated");

    var div = document.createElement("div");

    function register(title, func) {
        var button = document.createElement("button");
        button.textContent = title;
        button.addEventListener("click", func);
        div.appendChild(button);
    }

    register("Screenshot",  function (){
        let screen = calc_instance.getScreen();
        let image = new Image();
        const model = calc_instance.calcModel || calc_instance.ze?.productflavor || calc_instance.Ge?.productflavor
        image.src = screen;
        image.onload = function() {
            let canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d');
            // draw white background
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);
            canvas.toBlob( function(blob) {
                let link = document.createElement('a');
                link.download = `${model}_${Date.now()}.png`
                link.href = URL.createObjectURL(blob);
                link.click();
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then();
                }catch (e) {
                    console.error(e);
                    const div = document.createElement('div');
                    div.style.position = 'absolute';
                    div.style.left = '-9999px';
                    div.style.zIndex = '-9999';
                    div.contentEditable = true;
                    const img = document.createElement('img');
                    img.src = canvas.toDataURL();
                    div.appendChild(img);
                    document.body.appendChild(div);
                    const range = new Range();
                    range.selectNode(img);
                    document.getSelection().removeAllRanges();
                    document.getSelection().addRange(range);
                    document.execCommand('copy');
                    document.getSelection().removeAllRanges();
                    document.body.removeChild(div);
                }
            }, 'image/png');
        };
    });

    register("Full screen", function () {
        if (document.fullscreenEnabled) {
            document.documentElement.requestFullscreen().then();
        }
    });

    register("Dump ROM", function() {
        var url = window.URL.createObjectURL(new Blob([calc_instance.asic.mcu.codeMemory.mem], {type: "application/octet-stream"}));
        window.open(url);
        setTimeout(function() {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    });

    register("Load ROM", function() {
        var input = document.createElement("input");
        input.type = "file";

        input.onchange = function(e) {
            var file = e.target.files[0]; 
            var reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = function(readerEvent) {
                calc_instance.asic.mcu.codeMemory.setData(new Uint8Array(readerEvent.target.result));
            }
        }

        input.click();
    });

    register("Reset", function() {
        calc_instance.resetEmulator();
    });

    register("Halt", function() {
        clearInterval(calc_instance.asic.mcuInterval);
    });

    register("Step", function() {
       calc_instance.asic.mcu.interp1();
    });

    register("Break on PC", function() {
        clearInterval(calc_instance.asic.mcuInterval);

        var addr = parseInt(prompt("Address in decimal"));
        var id = setInterval(function() {
            if (calc_instance.asic.mcu.pc == addr) {
                clearInterval(id);
                alert("Breakpoint hit!");
                return;
            }

            calc_instance.asic.mcu.run();
            let irq_status = calc_instance.asic.mcu.dataMemory.get8(0x0, calc_instance.asic.mcu.dataMemory.INTERRUPT_IRQ7);
            if ((irq_status & 0x1) !== 0x0) {
                    irq_status = irq_status ^ 0x1;
                    calc_instance.asic.mcu.dataMemory.set8(0x0, irq_status, calc_instance.asic.mcu.dataMemory.INTERRUPT_IRQ7);
                    if (calc_instance.asic.mcu.keyEventProcessor.isQueueEmpty() && !calc_instance.asic.mcu.keyEventProcessor.isPotentialAutoRepeat()) {
                        calc_instance.asic.mcu.setLastKeyPressed(0x0);
                    }

                    calc_instance.asic.mcu.checkForInterrupt();
            }
        }, 0);
    });

    register("Break on data read", function() {
        var addr = parseInt(prompt("Address in decimal"));

        calc_instance.asic.mcu.dataMemory._get8 = calc_instance.asic.mcu.dataMemory.get8;
        calc_instance.asic.mcu.dataMemory.get8 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("Data breakpoint with 8 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.dataMemory.get8 = calc_instance.asic.mcu.dataMemory._get8;
                return;
            }

            var res = calc_instance.asic.mcu.dataMemory._get8(a, b);
            return res;
        }

        calc_instance.asic.mcu.dataMemory._get16 = calc_instance.asic.mcu.dataMemory.get16;
        calc_instance.asic.mcu.dataMemory.get16 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("Data breakpoint with 16 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.dataMemory.get16 = calc_instance.asic.mcu.dataMemory._get16;
                return;
            }   

            var res = calc_instance.asic.mcu.dataMemory._get16(a, b); 
            return res;
        }

        calc_instance.asic.mcu.dataMemory._get32 = calc_instance.asic.mcu.dataMemory.get32;
        calc_instance.asic.mcu.dataMemory.get32 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("Data breakpoint with 32 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.dataMemory.get32 = calc_instance.asic.mcu.dataMemory._get32;
                return;
            }   

            var res = calc_instance.asic.mcu.dataMemory._get32(a, b); 
            return res;
        }

        calc_instance.asic.mcu.dataMemory._get64 = calc_instance.asic.mcu.dataMemory.get64;
        calc_instance.asic.mcu.dataMemory.get64 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("Data breakpoint with 64 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.dataMemory.get64 = calc_instance.asic.mcu.dataMemory._get64;
                return;
            }   

            var res = calc_instance.asic.mcu.dataMemory._get64(a, b); 
            return res;
        }
    });

    register("Break on ROM read", function() {
        var addr = parseInt(prompt("Address in decimal"));

        calc_instance.asic.mcu.codeMemory._get8 = calc_instance.asic.mcu.codeMemory.get8;
        calc_instance.asic.mcu.codeMemory.get8 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("ROM breakpoint with 8 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.codeMemory.get8 = calc_instance.asic.mcu.codeMemory._get8;
                return;
            }   

            var res = calc_instance.asic.mcu.codeMemory._get8(a, b); 
            return res;
        }   

        calc_instance.asic.mcu.codeMemory._get16 = calc_instance.asic.mcu.codeMemory.get16;
        calc_instance.asic.mcu.codeMemory.get16 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("ROM breakpoint with 16 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.codeMemory.get16 = calc_instance.asic.mcu.codeMemory._get16;
                return;
            }   

            var res = calc_instance.asic.mcu.codeMemory._get16(a, b); 
            return res;
        }   

        calc_instance.asic.mcu.codeMemory._get32 = calc_instance.asic.mcu.codeMemory.get32;
        calc_instance.asic.mcu.codeMemory.get32 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("ROM breakpoint with 32 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.codeMemory.get32 = calc_instance.asic.mcu.codeMemory._get32;
                return;
            }   

            var res = calc_instance.asic.mcu.codeMemory._get32(a, b); 
            return res;
        }   

        calc_instance.asic.mcu.codeMemory._get64 = calc_instance.asic.mcu.codeMemory.get64;
        calc_instance.asic.mcu.codeMemory.get64 = function(a, b) {
            if (a == addr & 0xffff) {
                alert("ROM breakpoint with 64 bit read hit at pc=" + calc_instance.asic.mcu.pc);
                calc_instance.asic.mcu.codeMemory.get64 = calc_instance.asic.mcu.codeMemory._get64;
                return;
            }   

            var res = calc_instance.asic.mcu.codeMemory._get64(a, b); 
            return res;
        }   
    });

    document.body.appendChild(div);
}
