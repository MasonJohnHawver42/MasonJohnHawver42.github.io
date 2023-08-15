const Carousel = class 
{
    constructor(id, id_expand, id_collapse, id_left, id_right, min_index, max_index) 
    {
        this.cover_div = document.getElementById(id);
        this.carousel_div = this.cover_div.getElementsByClassName('carousel')[0];
        this.children = this.carousel_div.getElementsByClassName('carousel-item');
        this.expand_button = document.getElementById(id_expand);
        this.collapse_button = document.getElementById(id_collapse);
        this.left_button = document.getElementById(id_left);
        this.right_button = document.getElementById(id_right);

        this.current_pos = 0;
        this.current_height = 0;
        this.index = min_index;
        this.min_index = min_index;
        this.max_index = max_index;
        this.state = false; //should use enum

        var self = this;

        this.expand_button.addEventListener("click", function() { console.log(self); self.expand(); } );
        this.collapse_button.addEventListener("click", function() { self.collapse(); });
        this.left_button.addEventListener("click", function() { self.move(-1); });
        this.right_button.addEventListener("click", function() { self.move(1); });

        this.animate(1);
        this.collapse();
    }

    move(index_delta) 
    {
        this.index = (this.index + index_delta) % this.max_index;
        if (this.index < this.min_index) { this.index = this.max_index; }
    }

    expand() 
    { 
        this.carousel_div.style.transform = "translate(0%, 0%)";
        // const carousel_bbox = this.carousel_div.getBoundingClientRect();
        // const item_bbox  = this.children[this.min_index].getBoundingClientRect();
        // this.carousel_div.style.flexDirection = "column";
        // this.carousel_div.style.width = "100%";
        this.carousel_div.style.display = "block";
        this.carousel_div.style.margin = "auto";

        // this.current_height = carousel_bbox.bottom - carousel_bbox.top;
        // this.carousel_div.style.height = `${this.current_height}px`;

        this.collapse_button.style.display = "inline";
        this.left_button.style.display = "none";
        this.right_button.style.display = "none";
        this.expand_button.style.display = "none";

        for (var i = 0; i < this.children.length; i++) 
        {
            this.children[i].style.display = (i >= this.min_index && i <= this.max_index) ? "block" : "none";
        }

        this.state = true;
    }

    collapse() 
    {  
        this.carousel_div.style.display = "flex";
        this.carousel_div.style.margin = "0px";
        this.carousel_div.style.flexDirection = "row";
        this.carousel_div.style.width = "max-content";
        this.carousel_div.style.height = "max-content"
        this.carousel_div.style.transform = `translate(${this.current_pos}px, 0%)`;

        this.collapse_button.style.display = "none";
        this.left_button.style.display = "inline";
        this.right_button.style.display = "inline";
        this.expand_button.style.display = "inline";

        for (var i = 0; i < this.children.length; i++) 
        {
            this.children[i].style.display = "block";
        }

        this.state = false;
    }

    animate(speed) 
    {
        const cover_bbox = this.cover_div.getBoundingClientRect();
        const carousel_bbox = this.carousel_div.getBoundingClientRect();
        const item_bbox = this.children[this.index].getBoundingClientRect();
        const start_bbox = this.children[this.min_index].getBoundingClientRect();
        const end_bbox = this.children[this.max_index].getBoundingClientRect();
        
        if (!this.state) 
        {
    
            var delta = ((cover_bbox.left + cover_bbox.right) / 2) - ((item_bbox.left + item_bbox.right) / 2)
            delta *= speed;
    
            var old_pos = carousel_bbox.left - cover_bbox.left;
            this.current_pos = old_pos + delta
    
            this.carousel_div.style.transform = `translate(${this.current_pos}px, 0%)`;
        }
        else 
        {
            // var delta = (end_bbox.bottom - carousel_bbox.bottom);
            // // delta *= speed;

            // var old_height = carousel_bbox.bottom - carousel_bbox.top;

            // console.log(delta)
            // this.current_height = old_height + delta;
            // this.carousel_div.style.height = `${this.current_height}px`;
        }

        // this.collapse_button.style.display = !this.state ? "none" : "inline";
        // this.left_button.style.display = this.state ? "none" : "inline";
        // this.right_button.style.display = this.state ? "none" : "inline";
        // this.expand_button.style.display = this.state ? "none" : "inline";
    }
}

