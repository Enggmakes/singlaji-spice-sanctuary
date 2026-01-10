import { motion } from 'framer-motion';
import { Award, Leaf, Heart, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import heroImage from '@/assets/hero-spices.jpg';

const values = [
  {
    icon: Leaf,
    title: 'Pure & Natural',
    description: 'We source only the finest, chemical-free spices directly from farmers across India.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Every batch is tested to ensure it meets our rigorous quality standards.',
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Traditional stone-grinding methods preserve flavor and nutritional value.',
  },
  {
    icon: Users,
    title: 'Family Legacy',
    description: 'Three generations of expertise in crafting authentic Indian spice blends.',
  },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Indian Spices"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground/70" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary-foreground leading-tight mb-6">
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              A legacy of authentic flavors, passed down through generations, 
              bringing the heart of Indian cuisine to your kitchen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-lg max-w-none"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                From Our Family to Yours
              </h2>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  The Singlaji story began over 25 years ago in the heart of India's 
                  spice country. Our grandfather, with his deep knowledge of spices 
                  and unwavering commitment to quality, started blending masalas using 
                  age-old family recipes.
                </p>
                
                <p>
                  What started as a small operation serving our local community has 
                  grown into a beloved brand trusted by thousands of families across 
                  India. Yet, some things remain unchanged — our dedication to purity, 
                  our traditional stone-grinding methods, and our personal touch in 
                  every blend.
                </p>
                
                <p>
                  Today, we continue this legacy with the same passion. We work 
                  directly with farmers to source the finest spices, ensuring fair 
                  prices and sustainable practices. Every packet of Singlaji masala 
                  carries not just flavors, but the warmth of our family's tradition.
                </p>
                
                <p>
                  When you cook with Singlaji, you're not just adding spices to your 
                  food — you're adding a piece of our heritage, crafted with love and 
                  care for your family's table.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              What We Stand For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our values guide everything we do, from sourcing to packaging to delivery.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 text-center shadow-soft"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Our Promise
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Every Singlaji product is backed by our commitment to authenticity and 
                quality. We promise you spices that are 100% pure, freshly ground, and 
                packed with the vibrant flavors of India. If you're ever unsatisfied, 
                we'll make it right.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">25+ Years of Trust</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
