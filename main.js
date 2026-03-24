/* static_html/js/main.js */

// สร้างตัวแปร app เพื่อเก็บระบบการทำงานทั้งหมดของเว็บ
const app = {
    // state เก็บสถานะข้อมูลต่างๆ เช่น ของในตะกร้า, หน้าปัจจุบัน, ข้อมูลการค้นหา
    state: {
        cart: JSON.parse(localStorage.getItem('cart')) || [], 
        currentView: 'home', 
        currentProductId: null,
        modalProductId: null,
        modalQty: 1,
        modalOption: '',
        home: { category: 'ทั้งหมด', search: '' }, 
        product: { qty: 1, activeTab: 'story' } 
    },

    // init() คือฟังก์ชันแรกที่จะถูกเรียกเมื่อโหลดเว็บเสร็จ ทำหน้าที่ดึงข้อมูลและจัดการปุ่มย้อนกลับของมือถือ
    init() {
        this.home.renderCategories();
        this.home.filter(); 
        this.cart.updateUI(); 
        lucide.createIcons(); 
        
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) this.navigate(e.state.view, e.state.id, false);
            else this.navigate('home', null, false);
        });
    },

    // navigate() ใช้สำหรับเปลี่ยนหน้าเว็บไปมา (หน้าแรก <-> หน้ารายละเอียดสินค้า)
    navigate(view, id = null, pushState = true) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        this.state.currentView = view; this.state.currentProductId = id;
        
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) { targetView.classList.add('active'); window.scrollTo(0, 0); }
        
        const nav = document.getElementById('main-nav');
        if(nav) nav.style.display = (view === 'product') ? 'none' : 'flex';
        
        if (view === 'product' && id) this.product.render(id);
        else if (view === 'home') this.home.filter();
        
        if (pushState) {
            const url = view === 'home' ? '/' : `?product=${id}`;
            window.history.pushState({ view, id }, '', url);
        }
        lucide.createIcons();
    },

    // home คือระบบที่จัดการหน้าแรก (กล่องค้นหา, หมวดหมู่, และการวาดกล่องสินค้า)
    home: {
        renderCategories() {
            const container = document.getElementById('category-filters');
            if(!container) return;
            container.innerHTML = categories.map(cat => {
                const active = app.state.home.category === cat; 
                const cls = active ? 'bg-primary text-white font-medium shadow-sm' : 'bg-white text-muted-foreground border hover:border-primary/50 hover:text-primary';
                return `<button onclick="app.home.setCategory('${cat}')" class="px-4 py-2 rounded-full text-[13px] transition-all shrink-0 ${cls}">${cat}</button>`;
            }).join('');
        },
        setCategory(cat) { app.state.home.category = cat; this.renderCategories(); this.filter(); },
        
        filter() {
            const val = document.getElementById('search-input')?.value.toLowerCase() || '';
            app.state.home.search = val;
            const filtered = products.filter(p => (app.state.home.category === 'ทั้งหมด' || p.category === app.state.home.category) && (p.name.toLowerCase().includes(val) || (p.description && p.description.toLowerCase().includes(val))));
            this.renderGrid(filtered); 
            document.getElementById('product-count').innerText = `${filtered.length} รายการ`;
            document.getElementById('empty-state').classList.toggle('hidden', filtered.length > 0);
        },
        
        renderGrid(list) {
            const grid = document.getElementById('product-grid');
            if(!grid) return;
            grid.innerHTML = list.map(p => `
                <div onclick="app.navigate('product', ${p.id})" class="group bg-white rounded-2xl p-2 shadow-sm border-2 border-border/60 cursor-pointer flex flex-col relative transition-all hover:-translate-y-2 hover:shadow-xl hover:border-primary/60">
                    <div class="aspect-[4/5] rounded-xl overflow-hidden mb-3 bg-[#F9FAFB] relative">
                        ${p.badge ? `<span class="absolute top-2 right-2 bg-[#ff8fab] text-white text-[11px] px-2 py-1 rounded-full font-bold z-10 shadow-sm">${p.badge}</span>` : ''}
                        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='https://via.placeholder.com/400x500?text=ไม่มีรูป'">
                    </div>
                    <div class="px-2 pb-2 flex-1 flex flex-col">
                        <span class="text-[11px] text-muted-foreground">${p.category}</span>
                        <h3 class="font-sans text-[14px] font-medium leading-tight mb-2 text-foreground line-clamp-2">${p.name} ${p.emoji ? p.emoji : ''}</h3>
                        <div class="mt-auto flex justify-between items-end pt-2">
                            <span class="font-display font-semibold text-[16px] text-primary leading-none">฿${p.price}</span>
                            <button onclick="event.stopPropagation(); app.cart.openQtyModal(${p.id}, 1)" class="w-8 h-8 bg-[#E85D9F] text-white rounded-full flex items-center justify-center hover:scale-110 transition-all"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                </div>`).join('');
            lucide.createIcons(); 
        }
    },// product คือระบบจัดการหน้ารายละเอียดสินค้าเมื่อลูกค้ากดเข้ามาดู
    product: {
        // render() ทำหน้าที่ดึงข้อมูลสินค้าชิ้นนั้นๆ มาวาดแสดงบนหน้าจอ
        render(id) {
            const p = products.find(x => x.id === id); 
            if (!p) return;
            app.state.product.qty = 1; 
            const container = document.getElementById('view-product');
            if(!container) return;

            let subImagesHtml = '';
            if(p.subImages && p.subImages.length > 0) {
                subImagesHtml = `<div class="flex gap-2 mt-3 px-4 md:px-0">` + p.subImages.map(img => `
                    <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-colors" onclick="document.getElementById('main-img-${p.id}').src='${img}'">
                        <img src="${img}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                    </div>
                `).join('') + `</div>`;
            }

            container.innerHTML = `
              <div class="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between w-full">
    <button onclick="app.navigate('home')" class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-border/50"><i data-lucide="chevron-left" class="w-6 h-6"></i></button>
    <button onclick="app.cart.toggle()" class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-border/50 text-foreground hover:bg-primary hover:text-white transition-colors"><i data-lucide="shopping-bag" class="w-5 h-5"></i></button>
</div>
                
                <div class="max-w-5xl mx-auto md:flex md:gap-10 md:pt-24 pb-10">
                    <div class="w-full md:w-1/2">
                        <div class="aspect-[4/5] bg-[#F9FAFB] relative w-full md:rounded-[2rem] overflow-hidden">
                            <img id="main-img-${p.id}" src="${p.image}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x500?text=ไม่มีรูป'">
                        </div>
                        ${subImagesHtml} 
                    </div>
               
                    <div class="px-5 mt-6 md:w-1/2 flex flex-col">
                        <h1 class="font-display font-semibold text-[28px] text-foreground">${p.name} ${p.emoji ? p.emoji : ''}</h1>
                        <span class="font-display text-3xl text-primary font-semibold mt-2">฿${p.price}</span>
             
                        ${/* โค้ดส่วนนี้จะเช็คว่าสินค้ามีตัวเลือกหรือไม่ ถ้ามีจะสร้าง Dropdown ให้เลือก */ ''}
                        ${p.options && p.options.length > 0 ? `
                        <div class="mt-4">
                            <label class="text-[13px] text-muted-foreground mb-1 block">ตัวเลือกสินค้า:</label>
                            <select id="item-option" class="w-full border border-border/60 rounded-xl p-2.5 text-sm bg-white outline-none focus:border-primary">
                                ${p.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                            </select>
                        </div>
                        ` : ''}

                        <div class="bg-white rounded-2xl p-2 md:p-3 border border-border/50 shadow-sm flex-1 mt-6">
                            <div class="flex bg-background rounded-xl p-1.5" id="product-tabs"></div>
                            <div class="p-4 md:p-6 min-h-[150px] md:min-h-[250px]" id="tab-content"></div>
                        </div>
                    </div>
                </div>
                
                <div class="fixed bottom-0 left-0 right-0 z-50 bg-white px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] border-t border-border/50">
                    <div class="max-w-5xl mx-auto flex gap-3 justify-end items-center">
                        ${/* โค้ดปุ่มเพิ่มลงตะกร้า จะดึงค่าสีที่ลูกค้าเลือกไปด้วย */ ''}
                        <button onclick="const opt = document.getElementById('item-option') ? document.getElementById('item-option').value : ''; app.cart.openQtyModal(${p.id}, opt);" class="flex-1 h-[50px] bg-[#E85D9F] hover:bg-pink-600 text-white rounded-full font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
    <i data-lucide="shopping-bag" class="w-5 h-5"></i> เพิ่มลงตะกร้า
</button>
                    </div>
                </div>`;
            
            this.setTab(app.state.product.activeTab, p);
            lucide.createIcons();
        },

        // setTab() จัดการปุ่มสลับแท็บ รายละเอียด/ข้อมูลจำเพาะ
        setTab(tabId, obj = null) {
            app.state.product.activeTab = tabId;
            const p = obj || products.find(x => x.id === app.state.currentProductId); 
            
            const tabs = document.getElementById('product-tabs');
            if(tabs) {
                tabs.innerHTML = `
                <button onclick="app.product.setTab('story')" class="flex-1 py-2 md:py-2.5 text-[13px] md:text-[15px] font-sans rounded-lg transition-all ${tabId === 'story' ? 'bg-white shadow-sm font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}">รายละเอียด</button>
                <button onclick="app.product.setTab('specs')" class="flex-1 py-2 md:py-2.5 text-[13px] md:text-[15px] font-sans rounded-lg transition-all ${tabId === 'specs' ? 'bg-white shadow-sm font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}">ข้อมูลจำเพาะ</button>`;
            }

            const content = document.getElementById('tab-content');
            if(content) {
                content.innerHTML = tabId === 'story' 
                    ? `<div class="animate-fade-in space-y-4">
                        <p class="text-[14px] md:text-[16px] text-foreground font-sans leading-relaxed">${p.description}</p>
                        ${p.story ? `<div class="bg-background/80 p-4 md:p-5 rounded-xl border border-primary/10">
                            <h4 class="font-display font-medium text-primary mb-2 text-sm md:text-base flex items-center gap-2"><i data-lucide="sparkles" class="w-4 h-4"></i> เรื่องราว</h4>
                            <p class="text-[13px] md:text-[15px] text-muted-foreground leading-relaxed font-sans">${p.story}</p>
                        </div>`:''}
                       </div>`
                    : `<div class="animate-fade-in space-y-5 font-sans">
                        ${p.dimensions ? `<div>
                            <div class="text-[12px] md:text-[14px] text-muted-foreground mb-1.5 flex items-center gap-2"><i data-lucide="ruler" class="w-4 h-4"></i> ขนาด</div>
                            <div class="text-[14px] md:text-[16px] text-foreground pl-6">${p.dimensions}</div>
                        </div>`:''}
                        ${p.materials ? `<div>
                            <div class="text-[12px] md:text-[14px] text-muted-foreground mb-2 flex items-center gap-2"><i data-lucide="layers" class="w-4 h-4"></i> วัสดุ</div>
                            <ul class="text-[14px] md:text-[16px] space-y-2 text-foreground pl-6 list-disc marker:text-primary/50">
                                ${p.materials.map(m=>`<li>${m}</li>`).join('')}
                            </ul>
                        </div>`:''}
                       </div>`;
            }
            lucide.createIcons();
        }
    },
    // cart คือระบบตะกร้าสินค้าทั้งหมด
    cart: {
        // toggle() ใช้เปิด-ปิด หน้าต่างตะกร้าด้านข้าง
        toggle() {
            const drawer = document.getElementById('cart-drawer');
            const content = document.getElementById('cart-content'); const overlay = document.getElementById('cart-overlay');
            if(drawer.classList.contains('hidden')) { 
                drawer.classList.remove('hidden');
                requestAnimationFrame(() => { content.classList.remove('translate-y-full', 'md:translate-x-full'); overlay.classList.replace('opacity-0', 'opacity-100'); });
            } else { 
                content.classList.add('translate-y-full', 'md:translate-x-full');
                overlay.classList.replace('opacity-100', 'opacity-0');
                setTimeout(() => drawer.classList.add('hidden'), 300); 
            }
        },
        openQtyModal(id, option = '') {
            const p = products.find(x => x.id === id);
            if (!p) return;
            app.state.modalProductId = id; app.state.modalQty = 1; app.state.modalOption = option;
            document.getElementById('qty-modal-name').innerText = p.name + (option ?  (แบบ: ${option}) : '');
            document.getElementById('qty-modal-price').innerText = p.price + ' ฿';
            document.getElementById('qty-modal-img').src = p.image;
            document.getElementById('qty-modal-count').innerText = app.state.modalQty;
            const modal = document.getElementById('qty-modal');
            modal.classList.remove('hidden'); modal.classList.add('flex');
            setTimeout(() => document.getElementById('qty-modal-content').classList.remove('scale-95', 'opacity-0'), 10);
            lucide.createIcons();
        },
        closeQtyModal() {
            document.getElementById('qty-modal-content').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                const modal = document.getElementById('qty-modal');
                modal.classList.remove('flex'); modal.classList.add('hidden');
            }, 200);
        },
        changeModalQty(change) {
            let newQty = app.state.modalQty + change;
            if (newQty < 1) newQty = 1; if (newQty > 99) newQty = 99;
            app.state.modalQty = newQty;
            document.getElementById('qty-modal-count').innerText = app.state.modalQty;
        },
        confirmModalAdd() {
            this.add(app.state.modalProductId, app.state.modalQty, app.state.modalOption);
            this.closeQtyModal();
        },
        
        // add() โค้ดส่วนนี้รับข้อมูลสินค้า จำนวน และ "สีที่เลือก" เอาไปเก็บในตะกร้า
        add(id, qty = 1, option = '') {
            const p = products.find(x => x.id === id);
            const exist = app.state.cart.find(x => x.id === id && x.option === option); 
            if (exist) { 
                exist.qty += qty; 
                exist.selected = true;
            } else { 
                app.state.cart.push({ ...p, qty, selected: true, option: option });
            }
            
            this.save();
            this.updateUI(); 
            if (app.state.currentView === 'home') this.toggle(); 
            else alert("เพิ่มลงตะกร้าแล้ว"); 
        },
        
        remove(id, option = '') { 
            app.state.cart = app.state.cart.filter(x => !(x.id === id && x.option === option));
            this.save(); this.updateUI(); 
        },
        
        updateQty(id, d, option = '') { 
            const it = app.state.cart.find(x => x.id === id && x.option === option);
            if (it) { it.qty = Math.max(1, it.qty + d); this.save(); this.updateUI(); } 
        },
        
        toggleSelect(id, option = '') { 
            const it = app.state.cart.find(x => x.id === id && x.option === option);
            if (it) { it.selected = !it.selected; this.save(); this.updateUI(); } 
        },
        
        save() { localStorage.setItem('cart', JSON.stringify(app.state.cart)); },
        
        // checkout() โค้ดสำคัญสำหรับคำนวณยอดเงินรวมและสร้างข้อความส่งเข้า Instagram
        // checkout() โค้ดสำคัญสำหรับคำนวณยอดเงินรวมและสร้างข้อความส่งเข้า Instagram
        checkout() {
            const selectedItems = app.state.cart.filter(i => i.selected);
            if (!selectedItems.length) { alert("กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นค่ะ"); return; }
            
            const total = selectedItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const totalQty = selectedItems.reduce((s, i) => s + i.qty, 0); // นับจำนวนชิ้นทั้งหมด
            const shippingFee = 50; 
            const grandTotal = total + shippingFee;

            const shopName = "Handmade Velvet"; 

            let msg = `✦ ใบสั่งซื้อสินค้า | ${shopName} ✦\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            
            // --- เงื่อนไขแยกรูปแบบข้อความ ---
            if (selectedItems.length <= 10) {
                // ถ้าสั่ง 10 รายการหรือน้อยกว่า ให้แสดงแบบไล่รายการปกติ
                selectedItems.forEach(i => { 
                    const optText = i.option ? ` [${i.option}]` : '';
                    msg += `▪️ ${i.name}${optText}\n   จำนวน: ${i.qty} ชิ้น | ${i.price * i.qty} ฿\n`; 
                });
            } else {
                // ถ้าสั่งเกิน 10 รายการ ให้แสดงแบบย่อ
                msg += `📦 รายการสินค้าที่เลือก: ${selectedItems.length} แบบ (รวม ${totalQty} ชิ้น)\n`;
                msg += `*(เนื่องจากรายการสินค้ามีจำนวนมาก ระบบจึงสรุปยอดรวมเพื่อความสะดวกในการตรวจสอบนะคะ)*\n`;
            }
            // -----------------------------

            msg += `━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `ยอดรวมสินค้า : ${total} ฿\n`;
            msg += `ค่าจัดส่ง : ${shippingFee} ฿\n`;
            msg += `ยอดชำระสุทธิ : ${grandTotal} ฿\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `📝 ขั้นตอนการสั่งซื้อ:\n`;
            msg += `1. รบกวนคุณลูกค้ารอแอดมินยืนยันยอด และแจ้งรายละเอียดบัญชีโอนเงินสักครู่นะคะ\n`;
            msg += `2. หลังชำระเงินเรียบร้อยแล้ว สามารถแนบสลิป พร้อมแจ้งชื่อ-ที่อยู่จัดส่งได้เลยค่ะ\n\n`;
            msg += `✨ ขอบพระคุณที่ไว้วางใจให้ ${shopName} ดูแลนะคะ 🤍`;

            const igUrl = 'https://www.instagram.com/handmade_velvet/'; 
            navigator.clipboard.writeText(msg).then(() => {
                alert("คัดลอกรายการแล้ว! ระบบจะพาท่านไปยัง Instagram เพื่อส่งข้อความหาแอดมินนะคะ ✨"); window.location.href = igUrl;
            }).catch(() => {
                alert("คัดลอกไม่สำเร็จ แต่ระบบจะพาท่านไปยัง Instagram ค่ะ"); window.location.href = igUrl;
            });
        },
        // updateUI() โค้ดส่วนนี้ทำหน้าที่วาดหน้าตาตะกร้า เอาชื่อสินค้า ราคา และสีที่เลือกมาแสดงผลให้ลูกค้าเห็น
        updateUI() {
            const elItems = document.getElementById('cart-items');
            const selectedItems = app.state.cart.filter(i => i.selected);
            
            const subTotal = selectedItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const shippingFee = selectedItems.length > 0 ? 50 : 0; 
            const grandTotal = subTotal + shippingFee;

            const badge = document.getElementById('cart-badge');
            const totalItems = app.state.cart.reduce((s, i) => s + i.qty, 0);
            if (badge) { badge.innerText = totalItems; badge.classList.toggle('hidden', totalItems === 0); }
            
            const subtotalEl = document.getElementById('cart-subtotal');
            if (subtotalEl) subtotalEl.innerText = `${subTotal} ฿`;
            const shippingEl = document.getElementById('cart-shipping'); if (shippingEl) shippingEl.innerText = `${shippingFee} ฿`;
            const totalEl = document.getElementById('cart-total');
            if (totalEl) totalEl.innerText = `${grandTotal} ฿`;
            
            if (!elItems) return;
            const checkoutBtn = document.getElementById('checkout-btn');

            if (!app.state.cart.length) {
                if(checkoutBtn) checkoutBtn.disabled = true;
                elItems.innerHTML = `<div class="py-16 text-center text-muted-foreground/60"><p>ตะกร้าว่างเปล่า</p></div>`;
            } else {
                if(checkoutBtn) checkoutBtn.disabled = selectedItems.length === 0;
                elItems.innerHTML = app.state.cart.map(i => `
                    <div class="flex gap-3 bg-white p-3 rounded-2xl border ${i.selected ? 'border-primary/50 bg-primary/5' : 'border-border/40'} shadow-sm">
                        <div class="flex items-center justify-center">
                            <input type="checkbox" onchange="app.cart.toggleSelect(${i.id}, '${i.option || ''}')" class="w-5 h-5 accent-primary cursor-pointer border-2 border-border" ${i.selected ? 'checked' : ''}>
                        </div>
                        <img src="${i.image}" class="w-16 h-16 rounded-xl object-cover" onerror="this.src='https://via.placeholder.com/150?text=ไม่มีรูป'">
                        <div class="flex-1 flex flex-col justify-center">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-col pr-2">
                                    <span class="text-[14px] font-medium line-clamp-1 ${i.selected ? 'text-foreground' : 'text-muted-foreground'}">${i.name}</span>
                                    ${i.option ? `<span class="text-[12px] text-muted-foreground mt-0.5">แบบ: ${i.option}</span>` : ''}
                                </div>
                                <button onclick="app.cart.remove(${i.id}, '${i.option || ''}')" class="text-muted-foreground/50 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                            <div class="flex justify-between items-end mt-2">
                                <span class="font-display font-semibold text-primary text-[15px]">${i.price} ฿</span>
                                <div class="flex items-center bg-background rounded-lg px-1.5 py-1 border border-border/50">
                                    <button onclick="app.cart.updateQty(${i.id}, -1, '${i.option || ''}')" class="w-6 h-6 flex justify-center items-center"><i data-lucide="minus" class="w-3 h-3"></i></button>
                                    <span class="w-6 text-center text-[12px] font-medium">${i.qty}</span>
                                    <button onclick="app.cart.updateQty(${i.id}, 1, '${i.option || ''}')" class="w-6 h-6 flex justify-center items-center"><i data-lucide="plus" class="w-3 h-3"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>`).join('');
                    
                    elItems.innerHTML = `<div class="mb-4 p-2.5 bg-white/80 backdrop-blur-sm border-2 border-[#FFB6C1] rounded-xl text-center text-[13px] text-black font-semibold shadow-sm flex items-center justify-center gap-1.5">🌸 สั่งซื้อเกิน 10 รายการ ระบบจะสรุปยอดรวมแบบย่อให้นะคะ 💖</div>` + elItems.innerHTML;
            }
            lucide.createIcons();
        }
    }
};

// โค้ดบรรทัดสุดท้าย: สั่งให้ระบบ app.init() เริ่มทำงานเมื่อเบราว์เซอร์โหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', () => app.init());
