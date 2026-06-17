import Link from "next/link";
import { FadeIn, SlideLeft, SlideRight } from '@components/UI/Motions/Motions';
import styles from "./About.module.css";

export default function About() {
  return (
    <section id="about-us" className={styles.section}>
      <div className={styles.container}>
        <SlideRight>
          <h1 className={styles.title}>
            A warm welcome to Wilcze Chatki!
          </h1>
        </SlideRight>
        <SlideLeft delay={0.2}>
          <div className={styles.content}>
            <p>
              Are you looking for a place to escape the hustle and bustle of the city, enjoy peace and quiet, and yet be close to the greatest attractions of Pomerania? Our two cozy cottages in{" "}
              <strong>Szumlesie Królewski</strong>, a picturesque village located
              between <strong>Gdańsk and Kościerzyna</strong>, are the perfect place
              for a family getaway, a holiday with friends, or a romantic
              weekend for two.
            </p>

            <p>
              Our property is located in a peaceful, green area that
              guarantees a respite from the daily rush and close contact with
              nature. It is a fantastic place for families with children,
              cycling enthusiasts, walkers, and anyone who
              wishes to recharge their batteries surrounded by Kashubian forests and lakes.
            </p>

            <p>
              The property is located in the village of Szumleś Królewski. Thanks to
              this location, our guests can enjoy absolute peace and
              privacy, while having quick access to regional
              gems such as the Kashubian Landscape Park, Wieżyca peak, or
              the famous upside-down house in Szymbark.
            </p>

            <p>
              After a day full of impressions, we offer a relaxation zone
              with an <strong>infrared sauna</strong> and an atmospheric{" "}
              <strong>wood-fired jacuzzi</strong>. If you have any questions,
              please contact us via email, telephone, or through the contact form.
            </p>
          </div>
        </SlideLeft>

        <div className={styles.links}>
          <Link href="/#attractions" className={styles.link}>
            Read more about regional attractions &raquo;
          </Link>
        </div>
      </div>
    </section>
  );
}